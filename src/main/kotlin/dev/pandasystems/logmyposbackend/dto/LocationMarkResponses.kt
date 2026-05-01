package dev.pandasystems.logmyposbackend.dto

import dev.pandasystems.logmyposbackend.model.LocationMark
import dev.pandasystems.logmyposbackend.model.LocationMarkImage
import java.time.LocalDateTime
import java.util.*

data class LocationMarkResponse(
	val id: Long,
	val ownerUserId: UUID,

	val title: String,
	val description: String,

	val images: List<LocationMarkImageResponse>,

	val latitude: Double,
	val longitude: Double,

	val createdAt: LocalDateTime,
	val updatedAt: LocalDateTime
)

fun LocationMark.toResponse(): LocationMarkResponse {
	return LocationMarkResponse(
		id = this.id!!,
		ownerUserId = this.ownerUserId,
		title = this.title,
		description = this.description,
		images = this.images.map { it.toResponse() },
		latitude = this.latitude,
		longitude = this.longitude,
		createdAt = this.createdAt,
		updatedAt = this.updatedAt
	)
}

data class LocationMarkImageResponse(
	val id: Long,
	val url: String,
	val alternative: String,
)

fun LocationMarkImage.toResponse(): LocationMarkImageResponse {
	return LocationMarkImageResponse(
		id = this.id!!,
		url = this.url,
		alternative = this.alternative
	)
}