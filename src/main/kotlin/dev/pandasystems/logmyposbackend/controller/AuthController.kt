package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.LoginRequest
import dev.pandasystems.logmyposbackend.dto.LoginResponse
import dev.pandasystems.logmyposbackend.dto.UserCreateRequest
import dev.pandasystems.logmyposbackend.dto.UserResponse
import dev.pandasystems.logmyposbackend.dto.toResponse
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import dev.pandasystems.logmyposbackend.security.JwtService
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
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
	private val authenticationManager: AuthenticationManager,
	private val jwtService: JwtService,
) {
	@PostMapping("/register")
	fun register(@RequestBody request: UserCreateRequest): ResponseEntity<UserResponse> {
		if (userRepository.existsByUsername(request.username)) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "Username already exists")
		}

		if (userRepository.existsByEmail(request.email)) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "Email already exists")
		}

		val encodedPassword = passwordEncoder.encode(request.password)!!
		val user = userRepository.save(
			User(
				username = request.username,
				email = request.email,
				hashedPassword = encodedPassword
			)
		)
		return ResponseEntity(user.toResponse(), HttpStatus.CREATED)
	}

	@PostMapping("/login")
	fun login(@RequestBody request: LoginRequest): LoginResponse {
		val authentication = authenticationManager.authenticate(
			UsernamePasswordAuthenticationToken(request.identifier, request.password)
		)
		
		if (!authentication.isAuthenticated)
			throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")

		val token = jwtService.generateToken(request.identifier)
		return LoginResponse(token)
	}
}

