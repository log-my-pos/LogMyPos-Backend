package dev.pandasystems.logmyposbackend.repositories

import dev.pandasystems.logmyposbackend.model.Profile
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface ProfileRepository : JpaRepository<Profile, UUID> {
	fun findProfileByUserId(userId: UUID): Optional<Profile>
	fun existsProfileByUserId(userId: UUID): Boolean
}
