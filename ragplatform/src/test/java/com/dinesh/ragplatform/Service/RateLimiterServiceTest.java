package com.dinesh.ragplatform.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Should allow request when counter is within limit")
    void testAllowWithinLimit() {
        when(valueOperations.increment(anyString())).thenReturn(5L);

        boolean allowed = rateLimiterService.tryAcquire("test_user");

        assertThat(allowed).isTrue();
    }

    @Test
    @DisplayName("Should set 60s TTL on first request in window")
    void testSetTtlOnFirstRequest() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        boolean allowed = rateLimiterService.tryAcquire("test_user");

        assertThat(allowed).isTrue();
        verify(redisTemplate).expire(anyString(), eq(Duration.ofSeconds(60)));
    }

    @Test
    @DisplayName("Should reject request when counter exceeds MAX_REQUESTS_PER_MINUTE (12)")
    void testRejectWhenExceeded() {
        when(valueOperations.increment(anyString())).thenReturn(13L);

        boolean allowed = rateLimiterService.tryAcquire("test_user");

        assertThat(allowed).isFalse();
    }

    @Test
    @DisplayName("Should fail open (allow request) if Redis throws an exception")
    void testFailOpenOnRedisException() {
        when(valueOperations.increment(anyString())).thenThrow(new RuntimeException("Redis connection timed out"));

        boolean allowed = rateLimiterService.tryAcquire("test_user");

        // Fail-open guarantees the RAG platform remains functional even during Redis hiccups
        assertThat(allowed).isTrue();
    }
}
