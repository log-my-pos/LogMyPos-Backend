package dev.pandasystems.logmyposbackend.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
class SecurityConfig(
	private val jwtAuthenticationFilter: JwtAuthenticationFilter
) {
	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http
			.csrf { it.disable() }
			.sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
			.authorizeHttpRequests { auth ->
				auth.requestMatchers(
					"/api/auth/**",
					"/docs/**",
					"/api-docs/**",
					"/swagger-ui/**",
					"/v3/api-docs/**",
					"/webjars/**",
				).permitAll()
					.anyRequest().authenticated()
			}
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

		return http.build()
	}

	@Bean
	fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

	@Bean
	fun authenticationManager(configuration: AuthenticationConfiguration): AuthenticationManager =
		configuration.authenticationManager
}
