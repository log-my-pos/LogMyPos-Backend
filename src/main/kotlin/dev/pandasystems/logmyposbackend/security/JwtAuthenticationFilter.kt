package dev.pandasystems.logmyposbackend.security

import io.jsonwebtoken.JwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
	private val jwtService: JwtService,
	private val userDetailsService: UserDetailsService
) : OncePerRequestFilter() {
	
	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain
	) {
		try {
			val token = extractTokenFromRequest(request)
			
			if (token != null) {
				val username = jwtService.extractUsername(token)
				
				if (username != null && SecurityContextHolder.getContext().authentication == null) {
					val userDetails = userDetailsService.loadUserByUsername(username)
					
					val authentication = UsernamePasswordAuthenticationToken(
						userDetails, 
						null, 
						userDetails.authorities
					)
					SecurityContextHolder.getContext().authentication = authentication
				}
			}
		} catch (e: JwtException) {
			// Token is invalid or expired -> respond 401 and stop filter chain
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired JWT token")
			return
		} catch (e: Exception) {
			// Unexpected error while parsing token -> respond 401
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token")
			return
		}

		filterChain.doFilter(request, response)
	}
	
	private fun extractTokenFromRequest(request: HttpServletRequest): String? {
		val authHeader = request.getHeader("Authorization")
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7)
		}
		return null
	}
}


