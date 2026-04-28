package dev.pandasystems.logmyposbackend.repositories

import dev.pandasystems.logmyposbackend.model.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface UserRepository : JpaRepository<User, UUID> {
	fun existsByEmail(email: String): Boolean
	fun existsByUsername(username: String): Boolean
	fun findByUsernameOrEmail(username: String, email: String): Optional<User>
}