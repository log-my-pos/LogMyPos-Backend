package dev.pandasystems.logmyposbackend.security

import dev.pandasystems.logmyposbackend.repositories.UserRepository
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User as UserDetailsBuilder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService(
	private val userRepository: UserRepository
) : UserDetailsService {
	override fun loadUserByUsername(username: String): UserDetails {
		val user = userRepository.findByUsernameOrEmail(username, username)
			.orElseThrow { UsernameNotFoundException("User not found") }

		return UserDetailsBuilder.builder()
			.username(user.username)
			.password(user.hashedPassword)
			.roles(user.role.name)
			.build()
	}
}
