package dev.pandasystems.logmyposbackend.dto

data class ProfileCreateRequest(
	val displayName: String,
)

data class ProfileUpdateRequest(
	val displayName: String? = null,
)