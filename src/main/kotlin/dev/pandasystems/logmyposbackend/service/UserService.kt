package dev.pandasystems.logmyposbackend.service

import dev.pandasystems.logmyposbackend.model.Profile
import dev.pandasystems.logmyposbackend.model.User
import dev.pandasystems.logmyposbackend.repositories.ProfileRepository
import dev.pandasystems.logmyposbackend.repositories.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.*

@Service
class UserService(
	private val userRepository: UserRepository,
	private val profileRepository: ProfileRepository,
) {
	fun currentAuthenticatedUser(): User {
		val authentication = SecurityContextHolder.getContext().authentication
			?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "You must be logged in")

		return userRepository.findByUsernameOrEmail(authentication.name, authentication.name)
			.orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found") }
	}
	
	fun getUserOrSelf(userId: UUID?): User {
		val currentUser = currentAuthenticatedUser()
		if (userId != null && currentUser.role != User.Role.ADMIN)
			throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can access other users")

		val id = userId ?: currentUser.id!!
		val user = userRepository.findById(id)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "User not found") }
		return user
	}
	
	fun getProfileOrSelf(userId: UUID?): Profile {
		val user = getUserOrSelf(userId)
		
		return profileRepository.findProfileByUserId(user.id!!)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found") }
	}
}