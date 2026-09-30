package com.dinesh.ragplatform.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String testSecret = "mySuperSecretKeyForNexusRagPlatform2026SecureKeyWithSufficientEntropy!";
    private final Long testExpirationMs = 86400000L; // 24 hours

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", testSecret);
        ReflectionTestUtils.setField(jwtUtil, "expiration", testExpirationMs);
    }

    @Test
    @DisplayName("Should generate token and correctly extract subject and tenantId")
    void testGenerateAndExtractClaims() {
        String username = "dinesh";
        String tenantId = "tenant_dinesh";

        String token = jwtUtil.generateToken(username, tenantId);

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractUsername(token)).isEqualTo(username);
        assertThat(jwtUtil.extractTenantId(token)).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Should return true for valid token matching username")
    void testIsTokenValid() {
        String username = "alice";
        String tenantId = "alice";

        String token = jwtUtil.generateToken(username, tenantId);

        assertThat(jwtUtil.isTokenValid(token, "alice")).isTrue();
        assertThat(jwtUtil.isTokenValid(token, "bob")).isFalse();
    }
}
