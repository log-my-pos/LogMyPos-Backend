package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.*
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import dev.pandasystems.logmyposbackend.service.UserService
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import java.util.*
import kotlin.collections.map

@RestController
@RequestMapping("/api/users")
class UserController(
	private val userService: UserService,
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder
) {
	@GetMapping("/all")
	@PreAuthorize("hasRole('ADMIN')")
	fun getAllUsers(): List<UserResponse> =
		userRepository.findAll()
			.map(User::toResponse)

	@GetMapping
	fun getUser(@RequestParam userId: UUID?): UserResponse {
		val user = userService.getUserOrSelf(userId)
		return user.toResponse()
	}

	@PatchMapping
	fun updateUser(@RequestParam userId: UUID?, @RequestBody request: UserUpdateRequest): UserResponse {
		val user = userService.getUserOrSelf(userId)

		request.username?.let { user.username = it }
		request.email?.let { user.email = it }
		request.password?.let { user.hashedPassword = passwordEncoder.encode(it)!! }
		user.updatedAt = LocalDateTime.now()

		return userRepository.save(user).toResponse()
	}

	@DeleteMapping
	fun deleteUser(@RequestBody userId: UUID?): ResponseEntity<Unit> {
		val currentUser = userService.currentAuthenticatedUser()
		if (userId != null && currentUser.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete other users")

		val id = userId ?: currentUser.id!!
		userRepository.deleteById(id)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}
}

