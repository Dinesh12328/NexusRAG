package com.dinesh.ragplatform.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.*;

@Component
public class JwtUtil {

    // reads from application.yml jwt.secret
    @Value("${jwt.secret}")
    private String secret;

    // reads from application.yml jwt.expiration
    @Value("${jwt.expiration}")
    private Long expiration;

    // creates a secure key from our secret string
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // creates a JWT token with username + tenantId inside
    public String generateToken(String username, String tenantId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantId", tenantId);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    // reads username out of a token
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    // reads tenantId out of a token
    public String extractTenantId(String token) {
        return extractClaims(token)
                .get("tenantId", String.class);
    }

    // checks if token is valid and not expired
    public boolean isTokenValid(String token, String username) {
        return extractUsername(token).equals(username)
                && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token)
                .getExpiration().before(new Date());
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}