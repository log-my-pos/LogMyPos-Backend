package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.LoginRequest
import dev.pandasystems.logmyposbackend.dto.UserCreateRequest
import dev.pandasystems.logmyposbackend.dto.UserResponse
import dev.pandasystems.logmyposbackend.dto.toResponse
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/auth")
class AuthController(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder,
	private val authenticationManager: AuthenticationManager
) {
	@PostMapping("/register")
	fun register(@RequestBody request: UserCreateRequest): ResponseEntity<UserResponse> {
		if (userRepository.existsByUsername(request.username)) {
			return ResponseEntity.of(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Username already exists")).build()
		}

		if (userRepository.existsByEmail(request.email)) {
			return ResponseEntity.of(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Email already exists")).build()
		}

		val encodedPassword = passwordEncoder.encode(request.password)!!
		val user = userRepository.save(
			User(
				username = request.username,
				email = request.email,
				hashedPassword = encodedPassword
			)
		)
		return ResponseEntity.status(HttpStatus.CREATED).body(user.toResponse())
	}

	@PostMapping("/login")
	fun login(
		@RequestBody request: LoginRequest,
		httpServletRequest: HttpServletRequest
	): ResponseEntity<UserResponse> {
		try {
			val authentication = authenticationManager.authenticate(
				UsernamePasswordAuthenticationToken(request.identifier, request.password)
			)
			val context = SecurityContextHolder.createEmptyContext().apply {
				this.authentication = authentication
			}
			SecurityContextHolder.setContext(context)
			httpServletRequest.getSession(true)
				.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context)

			val user = userRepository.findByUsernameOrEmail(authentication.name, authentication.name)
				.orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials") }

			return ResponseEntity.ok(user.toResponse())
		} catch (_: AuthenticationException) {
			throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username/email or password")
		}
	}
}

