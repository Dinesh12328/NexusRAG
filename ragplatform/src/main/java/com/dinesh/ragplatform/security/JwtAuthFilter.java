package com.dinesh.ragplatform.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImp userDetailsService;

    public JwtAuthFilter(JwtUtil jwtUtil, UserDetailsServiceImp userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Read Authorization header
        final String authHeader =
                request.getHeader("Authorization");

        // 2. If no token → skip (public endpoint)
        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 3. Extract token (remove "Bearer " prefix)
            final String token = authHeader.substring(7);
            final String username = jwtUtil.extractUsername(token);

            // 4. Validate token and set authentication
            if (username != null &&
                    SecurityContextHolder.getContext()
                            .getAuthentication() == null) {

                if (jwtUtil.isTokenValid(token, username)) {
                    UserDetails userDetails = org.springframework.security.core.userdetails.User
                            .withUsername(username)
                            .password("")
                            .roles("USER")
                            .build();

                    // 5. Tell Spring Security this user is authenticated
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));

                    SecurityContextHolder.getContext()
                            .setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // If token is expired, invalid, or malformed, clear authentication and let Spring Security handle it
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

}
