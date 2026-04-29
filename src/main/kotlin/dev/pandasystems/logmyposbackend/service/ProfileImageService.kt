package dev.pandasystems.logmyposbackend.service

import dev.pandasystems.logmyposbackend.config.SupabaseStorageConfig
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import java.util.UUID

@Service
class ProfileImageService(
	private val supabaseStorageConfig: SupabaseStorageConfig,
	@Value($$"${supabase.storage.bucket}") private val bucket: String,
	@Value($$"${supabase.storage.endpoint-url}") private val endpointUrl: String,
	@Value($$"${supabase.storage.public-endpoint-url}") private val publicUrlBase: String,
	@Value($$"${supabase.storage.access-key}") private val accessKey: String,
	@Value($$"${supabase.storage.secret-key}") private val secretKey: String,
) {
	private val allowedContentTypes = mapOf(
		"image/jpeg" to "jpg",
		"image/png" to "png",
		"image/webp" to "webp"
	)

	fun uploadProfileImage(userId: UUID, image: MultipartFile): String {
		if (!isConfigured()) {
			throw ResponseStatusException(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"Supabase storage is not configured"
			)
		}

		if (image.isEmpty) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image is required")
		}

		val contentType = image.contentType
			?.substringBefore(";")
			?.trim()
			?.lowercase()
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image content type is required")

		val extension = allowedContentTypes[contentType]
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, and WEBP images are supported")

		val key = "profiles/$userId/${UUID.randomUUID()}.$extension"
		val request = PutObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.contentType(contentType)
			.build()
		val s3Client = supabaseStorageConfig.supabaseS3Client()

		image.inputStream.use { inputStream ->
			s3Client.putObject(request, RequestBody.fromInputStream(inputStream, image.size))
		}

		return "${publicUrlBase.trimEnd('/')}/$bucket/$key"
	}

	private fun isConfigured(): Boolean =
		endpointUrl.isNotBlank() &&
				!endpointUrl.contains("example.invalid") &&
				publicUrlBase.isNotBlank() &&
				!publicUrlBase.contains("example.invalid") &&
				bucket.isNotBlank() &&
				accessKey.isNotBlank() &&
				secretKey.isNotBlank()
}



