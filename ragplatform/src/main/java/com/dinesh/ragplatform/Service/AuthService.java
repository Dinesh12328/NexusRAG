package com.dinesh.ragplatform.Service;

import com.dinesh.ragplatform.model.user;
import com.dinesh.ragplatform.repository.UserRepository;
import com.dinesh.ragplatform.security.JwtUtil;
import com.dinesh.ragplatform.dto.AuthResponse;
import com.dinesh.ragplatform.dto.LoginRequest;
import com.dinesh.ragplatform.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // ─────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Check duplicate username
        if (userRepository.existsByUsername(
                request.getUsername())) {
            throw new RuntimeException(
                    "Username already exists");
        }

        // Check duplicate email
        if (userRepository.existsByEmail(
                request.getEmail())) {
            throw new RuntimeException(
                    "Email already exists");
        }

        // Build and save user
        // password is hashed — never stored as plain text
        user newUser = user.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(
                        request.getPassword()))
                .tenantId(request.getUsername())
                .build();

        userRepository.save(newUser);

        log.info("User registered: {}",
                request.getUsername());

        // Generate JWT token immediately after register
        // so user doesn't need to login separately
        String token = jwtUtil.generateToken(
                newUser.getUsername(),
                newUser.getTenantId());

        return AuthResponse.builder()
                .token(token)
                .username(newUser.getUsername())
                .email(newUser.getEmail())
                .tenantId(newUser.getTenantId())
                .message("User registered successfully")
                .build();
    }

    // ─────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {

        // authenticate() does TWO things internally:
        // 1. loads user from DB via UserDetailsServiceImpl
        // 2. compares submitted password with stored hash
        // throws BadCredentialsException if wrong password
        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getUsername(),
                                request.getPassword()));

        // get username from authentication result
        // no extra DB query needed
        String username = authentication.getName();

        // load user to get tenantId and email for response
        user existingUser = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        log.info("User logged in: {}", username);

        // Generate fresh JWT token
        String token = jwtUtil.generateToken(
                existingUser.getUsername(),
                existingUser.getTenantId());

        return AuthResponse.builder()
                .token(token)
                .username(existingUser.getUsername())
                .email(existingUser.getEmail())
                .tenantId(existingUser.getTenantId())
                .message("Login successful")
                .build();
    }
}