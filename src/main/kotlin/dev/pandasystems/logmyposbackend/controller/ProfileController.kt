package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.ProfileCreateRequest
import dev.pandasystems.logmyposbackend.dto.ProfileResponse
import dev.pandasystems.logmyposbackend.dto.ProfileUpdateRequest
import dev.pandasystems.logmyposbackend.dto.toResponse
import dev.pandasystems.logmyposbackend.model.Profile
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.ProfileRepository
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import jakarta.websocket.server.PathParam
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import java.util.UUID

@RestController
@RequestMapping("/api/profiles")
class ProfileController(
	val profileRepository: ProfileRepository,
	val userController: UserController
) {
	@GetMapping("/user")
	fun getProfileByUser(@RequestParam userId: UUID?): ProfileResponse {
		val currentUser = userController.currentAuthenticatedUser()
		val id = userId ?: currentUser.id!!
		
		return profileRepository.findProfileByUserId(id)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found") }
			.toResponse()
	}

	@PostMapping("/user")
	fun createProfileByUser(@RequestParam userId: UUID?, @RequestBody request: ProfileCreateRequest): ProfileResponse {
		val currentUser = userController.currentAuthenticatedUser()
		if (userId != null && currentUser.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can create other users' profiles")

		val id = userId ?: currentUser.id!!
		if (profileRepository.existsProfileByUserId(id))
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile already exists for this user")
		
		return profileRepository.save(
			Profile(
				userId = id,
				displayName = request.displayName,
			)
		).toResponse()
	}
	
	@PatchMapping("/user")
	fun updateProfileByUser(@RequestParam userId: UUID?, @RequestBody request: ProfileUpdateRequest): ProfileResponse {
		val currentUser = userController.currentAuthenticatedUser()
		if (userId != null && currentUser.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can update other users' profiles")
		
		val id = userId ?: currentUser.id!!
		val profile = profileRepository.findProfileByUserId(id)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found") }

		request.displayName?.let { profile.displayName = it }
		profile.updatedAt = LocalDateTime.now()
		
		return profileRepository.save(profile).toResponse()
	}
	
	@DeleteMapping("/user")
	fun deleteProfileByUser(@RequestParam userId: UUID?) : ResponseEntity<Unit> {
		val currentUser = userController.currentAuthenticatedUser()
		if (userId != null && currentUser.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete other users' profiles")

		val id = userId ?: currentUser.id!!
		profileRepository.deleteById(id)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}
}
