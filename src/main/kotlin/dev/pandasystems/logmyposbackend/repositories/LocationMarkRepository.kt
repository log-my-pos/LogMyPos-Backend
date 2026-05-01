package dev.pandasystems.logmyposbackend.repositories

import dev.pandasystems.logmyposbackend.model.LocationMark
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface LocationMarkRepository : JpaRepository<LocationMark, Long> {
	fun findLocationMarkById(id: Long): Optional<LocationMark>
	fun findLocationMarkByOwnerUserId(ownerUserId: UUID): List<LocationMark>
}