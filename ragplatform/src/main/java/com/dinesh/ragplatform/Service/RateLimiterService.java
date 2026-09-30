package com.dinesh.ragplatform.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    // 12 requests per minute limit per tenant (matches Gemini free tier safely)
    private static final int MAX_REQUESTS_PER_MINUTE = 12;

    /**
     * Checks if tenant has exceeded the rate limit.
     * @param tenantId The tenant username
     * @return true if request is allowed, false if rate limited
     */
    public boolean tryAcquire(String tenantId) {
        String key = "ratelimit:" + tenantId + ":" + (System.currentTimeMillis() / 60000);

        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, Duration.ofSeconds(60));
            }
            if (count != null && count > MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for tenant '{}': {} requests in current minute", tenantId, count);
                return false;
            }
            return true;
        } catch (Exception e) {
            log.warn("Redis unavailable for rate limiting, failing open: {}", e.getMessage());
            return true; // Fail open so app doesn't break if Redis is temporarily unreachable
        }
    }

    public int getMaxRequestsPerMinute() {
        return MAX_REQUESTS_PER_MINUTE;
    }
}
