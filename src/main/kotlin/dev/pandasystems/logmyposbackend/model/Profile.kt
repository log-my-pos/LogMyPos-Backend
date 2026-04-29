package dev.pandasystems.logmyposbackend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "profiles")
class Profile(
	@Id @GeneratedValue
	var id: UUID? = null,
	
	@Column(unique = true)
	var userId: UUID,
	
	var displayName: String,
	@Column(length = 2048)
	var profileImageUrl: String = "",
	var createdAt: LocalDateTime = LocalDateTime.now(),
	var updatedAt: LocalDateTime = LocalDateTime.now()
)
