package dev.pandasystems.logmyposbackend.dto

import dev.pandasystems.logmyposbackend.model.User
import java.time.LocalDateTime
import java.util.UUID

data class UserResponse(
	val id: UUID,
	val username: String,
	val email: String,
	val role: User.Role,
	var createdAt: LocalDateTime,
	var updatedAt: LocalDateTime
)

fun User.toResponse() = UserResponse(
	id = this.id!!,
	username = this.username,
	email = this.email,
	role = this.role,
	createdAt = this.createdAt,
	updatedAt = this.updatedAt,
)