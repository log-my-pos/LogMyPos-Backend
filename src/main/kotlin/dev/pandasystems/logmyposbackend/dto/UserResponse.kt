package dev.pandasystems.logmyposbackend.dto

import dev.pandasystems.logmyposbackend.model.User
import java.util.UUID

data class UserResponse(
	val id: UUID,
	val username: String,
	val email: String,
	val role: User.Role
)

fun User.toResponse() = UserResponse(
	id = this.id!!,
	username = this.username,
	email = this.email,
	role = this.role
)