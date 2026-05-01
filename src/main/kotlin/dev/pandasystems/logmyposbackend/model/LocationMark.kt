package dev.pandasystems.logmyposbackend.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "location_marks")
class LocationMark(
	@Id
	@GeneratedValue
	var id: Long? = null,

	var ownerUserId: UUID,

	var title: String,
	var description: String,

	@OneToMany(mappedBy = "locationMark", cascade = [CascadeType.ALL], orphanRemoval = true)
	var images: MutableList<LocationMarkImage> = mutableListOf(),

	var latitude: Double,
	var longitude: Double,

	var createdAt: LocalDateTime = LocalDateTime.now(),
	var updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity
@Table(name = "location_mark_images")
class LocationMarkImage(
	@Id
	@GeneratedValue
	var id: Long? = null,

	var url: String,
	var alternative: String,

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "location_mark_id", nullable = false)
	var locationMark: LocationMark? = null
)