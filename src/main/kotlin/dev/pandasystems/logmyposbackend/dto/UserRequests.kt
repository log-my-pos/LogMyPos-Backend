package dev.pandasystems.logmyposbackend.dto

data class UserCreateRequest(
    val username: String,
    val email: String,
    val password: String
)

data class UserUpdateRequest(
    val username: String? = null,
    val email: String? = null,
    val password: String? = null
)

