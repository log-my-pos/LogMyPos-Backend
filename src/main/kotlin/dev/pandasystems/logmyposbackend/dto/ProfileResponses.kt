package dev.pandasystems.logmyposbackend.dto

import dev.pandasystems.logmyposbackend.model.Profile
import java.time.LocalDateTime
import java.util.UUID

data class ProfileResponse(
	val id: UUID,
	val displayName: String,
	val profileImageUrl: String,
	val createdAt: LocalDateTime,
	val updatedAt: LocalDateTime
)

fun Profile.toResponse() = ProfileResponse(
	id = this.id!!,
	displayName = this.displayName,
	profileImageUrl = this.profileImageUrl,
	createdAt = this.createdAt,
	updatedAt = this.updatedAt
)