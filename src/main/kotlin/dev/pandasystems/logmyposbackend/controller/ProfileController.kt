package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.ProfileCreateRequest
import dev.pandasystems.logmyposbackend.dto.ProfileResponse
import dev.pandasystems.logmyposbackend.dto.ProfileUpdateRequest
import dev.pandasystems.logmyposbackend.dto.toResponse
import dev.pandasystems.logmyposbackend.model.Profile
import dev.pandasystems.logmyposbackend.repositories.ProfileRepository
import dev.pandasystems.logmyposbackend.service.BucketService
import dev.pandasystems.logmyposbackend.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import java.util.UUID

@RestController
@RequestMapping("/api/profiles")
class ProfileController(
	val profileRepository: ProfileRepository,
	val userService: UserService,
	val bucketService: BucketService
) {
	@GetMapping("/user")
	fun getProfileByUser(@RequestParam userId: UUID?): ProfileResponse = userService.getProfileOrSelf(userId).toResponse()

	@PostMapping("/user")
	fun createProfileByUser(@RequestParam userId: UUID?, @RequestBody request: ProfileCreateRequest): ProfileResponse {
		val user = userService.getUserOrSelf(userId)
		if (profileRepository.existsProfileByUserId(user.id!!))
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile already exists for this user")
		
		return profileRepository.save(
			Profile(
				userId = user.id!!,
				displayName = request.displayName,
			)
		).toResponse()
	}
	
	@PostMapping("/user/image", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
	fun uploadProfileImageByUser(
		@RequestParam userId: UUID?,
		@RequestParam("image") image: MultipartFile
	): ProfileResponse {
		val profile = userService.getProfileOrSelf(userId!!)
		
		profile.profileImageUrl = bucketService.uploadProfileImage(profile.userId, image)
		profile.updatedAt = LocalDateTime.now()

		return profileRepository.save(profile).toResponse()
	}
	
	@PatchMapping("/user")
	fun updateProfileByUser(@RequestParam userId: UUID?, @RequestBody request: ProfileUpdateRequest): ProfileResponse {
		val profile = userService.getProfileOrSelf(userId!!)

		request.displayName?.let { profile.displayName = it }
		profile.updatedAt = LocalDateTime.now()
		
		return profileRepository.save(profile).toResponse()
	}
	
	@DeleteMapping("/user")
	fun deleteProfileByUser(@RequestParam userId: UUID?) : ResponseEntity<Void> {
		val profile = userService.getProfileOrSelf(userId)
		profileRepository.delete(profile)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}
}
