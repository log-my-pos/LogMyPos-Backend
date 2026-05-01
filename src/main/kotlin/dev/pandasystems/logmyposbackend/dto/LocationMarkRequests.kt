package dev.pandasystems.logmyposbackend.dto

import org.springframework.web.multipart.MultipartFile

data class LocationMarkCreateRequest(
	val title: String,
	val description: String,
	val latitude: Double,
	val longitude: Double
)

data class LocationMarkUpdateRequest(
	val title: String? = null,
	val description: String? = null,
	val latitude: Double? = null,
	val longitude: Double? = null
)