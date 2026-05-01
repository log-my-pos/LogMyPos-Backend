package dev.pandasystems.logmyposbackend.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.util.*

@Service
class BucketService(
	private val s3Client: S3Client,
	@Value($$"${supabase.storage.public-endpoint-url}") private val publicUrlBase: String,
) {
	private val profileImageBucket = "profile-images"
	private val locationImageBucket = "location-images"
	
	private val allowedImageFormats = mapOf(
		"image/jpeg" to "jpg",
		"image/png" to "png",
		"image/webp" to "webp"
	)
	
	fun uploadProfileImage(userId: UUID, image: MultipartFile): String {
		if (image.isEmpty) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image is required")

		val contentType = image.contentType
			?.substringBefore(";")
			?.trim()
			?.lowercase()
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image content type is required")

		val extension = allowedImageFormats[contentType]
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, and WEBP images are supported")

		val key = "$userId/${UUID.randomUUID()}.$extension"
		return uploadFile(profileImageBucket, key, contentType, image.bytes)
	}
	
	fun uploadLocationImage(locationId: Long, image: MultipartFile): String {
		val contentType = image.contentType
			?.substringBefore(";")
			?.trim()
			?.lowercase()
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Image content type is required")

		val extension = allowedImageFormats[contentType]
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, and WEBP images are supported")

		val key = "$locationId/${UUID.randomUUID()}.$extension"
		return uploadFile(locationImageBucket, key, contentType, image.bytes)
	}
	
	private fun uploadFile(bucket: String, key: String, contentType: String, bytes: ByteArray): String {
		val request = PutObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.contentType(contentType)
			.build()

		s3Client.putObject(request, RequestBody.fromBytes(bytes))
		return "${publicUrlBase.trimEnd('/')}/$bucket/${key.trimStart('/')}"
	}
}