package dev.pandasystems.logmyposbackend.dto

data class LoginRequest(
	val identifier: String,
	val password: String
)

data class LoginResponse(
	val token: String,
)