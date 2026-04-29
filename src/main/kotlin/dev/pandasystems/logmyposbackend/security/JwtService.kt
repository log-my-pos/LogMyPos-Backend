package dev.pandasystems.logmyposbackend.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date

@Service
class JwtService(
    @Value("\${jwt.secret:your-very-long-and-secure-secret-key-here}")
    private val secret: String,
    @Value("\${jwt.expiration-ms:3600000}")
    private val expirationTime: Long
) {
    private val secretKey by lazy { Keys.hmacShaKeyFor(secret.toByteArray()) }

    fun generateToken(username: String): String {
        return Jwts.builder()
            .subject(username)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationTime))
            .signWith(secretKey)
            .compact()
    }

    fun extractUsername(token: String): String? {
        return extractAllClaims(token).subject
    }

    fun isTokenValid(token: String): Boolean {
        return try {
            extractAllClaims(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun extractAllClaims(token: String): Claims {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}