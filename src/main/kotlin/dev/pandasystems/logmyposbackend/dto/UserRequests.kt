package dev.pandasystems.logmyposbackend.dto

import java.util.*

data class UserCreateRequest(
    val username: String,
    val email: String,
    val password: String
)

data class UserUpdateRequest(
    val id: UUID? = null,
    val username: String? = null,
    val email: String? = null,
    val password: String? = null
)

