package dev.pandasystems.logmyposbackend.controller

import dev.pandasystems.logmyposbackend.dto.LocationMarkCreateRequest
import dev.pandasystems.logmyposbackend.dto.LocationMarkImageResponse
import dev.pandasystems.logmyposbackend.dto.LocationMarkResponse
import dev.pandasystems.logmyposbackend.dto.LocationMarkUpdateRequest
import dev.pandasystems.logmyposbackend.dto.toResponse
import dev.pandasystems.logmyposbackend.model.LocationMark
import dev.pandasystems.logmyposbackend.model.LocationMarkImage
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.LocationMarkRepository
import dev.pandasystems.logmyposbackend.service.BucketService
import dev.pandasystems.logmyposbackend.service.UserService
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDateTime
import java.util.UUID

@RestController
@RequestMapping("/location")
class LocationMarkController(
	private val userService: UserService,
	private val locationRepository: LocationMarkRepository,
	private val bucketService: BucketService
) {
	@GetMapping
	fun getAllLocationsOwnedByUser(@RequestParam userId: UUID?): List<LocationMarkResponse> {
		val user = userService.getUserOrSelf(userId)
		val locations = locationRepository.findLocationMarkByOwnerUserId(user.id!!)
		return locations.map { it.toResponse() }
	}
	
	@GetMapping("/{id}")
	fun getLocationMarkEndpoint(@PathVariable id: Long): LocationMarkResponse = getLocation(id).toResponse()

	@PostMapping
	fun createLocationMark(
		@RequestParam userId: UUID?,
		@RequestBody request: LocationMarkCreateRequest
	): LocationMarkResponse {
		val user = userService.getUserOrSelf(userId)

		return locationRepository.save(
			LocationMark(
				ownerUserId = user.id!!,
				title = request.title,
				description = request.description,
				latitude = request.latitude,
				longitude = request.longitude,
			)
		).toResponse()
	}

	@PatchMapping("/{id}")
	fun updateLocationMark(
		@PathVariable id: Long,
		@RequestBody request: LocationMarkUpdateRequest
	): LocationMarkResponse {
		val location = getLocation(id)
		
		request.title?.let { location.title = it }
		request.description?.let { location.description = it }
		request.latitude?.let { location.latitude = it }
		request.longitude?.let { location.longitude = it }
		location.updatedAt = LocalDateTime.now()
		return locationRepository.save(location).toResponse()
	}

	@DeleteMapping("/{id}")
	fun deleteLocationMark(@PathVariable id: Long): ResponseEntity<Unit> {
		val location = getLocation(id)
		locationRepository.delete(location)
		return ResponseEntity(HttpStatus.NO_CONTENT)
	}

	@PostMapping("/{id}/images", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
	fun uploadLocationImage(
		@PathVariable id: Long,
		@RequestPart images: List<MultipartFile>,
		@RequestPart alts: List<String>
	): List<LocationMarkImageResponse> {
		if (images.size != alts.size)
			throw ResponseStatusException(
				HttpStatus.BAD_REQUEST, 
				"The amount of images and alternative text don't match"
			)

		val location = getLocation(id)
		
		val imagesToAdd = mutableListOf<LocationMarkImage>()
		images.forEachIndexed { index, file ->
			val altText = alts[index]
			val imageUrl = bucketService.uploadLocationImage(id, file)
			imagesToAdd.add(
				LocationMarkImage(
					url = imageUrl,
					alternative = altText
				)
			)
		}

		location.images.addAll(imagesToAdd)
		locationRepository.save(location)
		return imagesToAdd.map { it.toResponse() }
	}

	private fun getLocation(id: Long): LocationMark {
		val location = locationRepository.findById(id)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found") }
		val user = userService.currentAuthenticatedUser()
		
		if (location.ownerUserId != user.id && user.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only the owner can access this location")
		
		return location
	}
}