package dev.pandasystems.logmyposbackend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration
import java.net.URI

@Configuration
class SupabaseStorageConfig(
	@Value($$"${supabase.storage.endpoint-url}") private val endpointUrl: String,
	@Value($$"${supabase.storage.access-key}") private val accessKey: String,
	@Value($$"${supabase.storage.secret-key}") private val secretKey: String,
	@Value($$"${supabase.storage.region}") private val region: String,
) {
	@Bean
	fun supabaseS3Client(): S3Client = S3Client.builder()
		.endpointOverride(URI.create(endpointUrl))
		.region(Region.of(region))
		.credentialsProvider(
			StaticCredentialsProvider.create(
				AwsBasicCredentials.create(accessKey, secretKey)
			)
		)
		.serviceConfiguration(
			S3Configuration.builder()
				.pathStyleAccessEnabled(true)
				.build()
		)
		.build()
}


