package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.*
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.*
import kotlin.collections.map

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
class UserController(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder
) {
	@GetMapping("/all")
	fun getAllUsers(): List<UserResponse> =
		userRepository.findAll()
			.map(User::toResponse)

	@GetMapping
	@PreAuthorize("isAuthenticated()")
	fun getOwnUser(@PathVariable id: UUID): ResponseEntity<UserResponse> =
		userRepository.findById(id)
			.map { ResponseEntity.ok(it.toResponse()) }
			.orElseGet { ResponseEntity.notFound().build() }

	@GetMapping("/{id}")
	fun getUser(@PathVariable id: UUID): ResponseEntity<UserResponse> =
		userRepository.findById(id)
			.map { ResponseEntity.ok(it.toResponse()) }
			.orElseGet { ResponseEntity.notFound().build() }

	@PatchMapping
	@PreAuthorize("isAuthenticated()")
	fun updateUser(@RequestBody request: UserUpdateRequest): UserResponse {
		var user = currentAuthenticatedUser()
		if (user.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own account")

		request.id?.let { userRepository.findById(it).orElseThrow() }?.let { user = it }

		val updatedUser = User(
			id = user.id,
			username = request.username ?: user.username,
			email = request.email ?: user.email,
			hashedPassword = request.password?.let(passwordEncoder::encode) ?: user.hashedPassword,
			role = user.role
		)

		return userRepository.save(updatedUser).toResponse()
	}

	@DeleteMapping("/{id}")
	fun deleteUser(@PathVariable id: UUID): ResponseEntity<Unit> =
		userRepository.findById(id)
			.map {
				userRepository.delete(it)
				ResponseEntity.noContent().build<Unit>()
			}
			.orElseGet { ResponseEntity.notFound().build() }

	private fun currentAuthenticatedUser(): User {
		val authentication = SecurityContextHolder.getContext().authentication
			?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in")

		return userRepository.findByUsernameOrEmail(authentication.name, authentication.name)
			.orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found") }
	}
}

