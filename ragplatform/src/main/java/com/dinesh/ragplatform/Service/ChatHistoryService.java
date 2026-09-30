package com.dinesh.ragplatform.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatHistoryService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_HISTORY_MESSAGES = 10; // 5 user + 5 assistant turns
    private static final Duration HISTORY_TTL = Duration.ofHours(24);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryMessage {
        private String role;     // "user" or "assistant"
        private String content;  // message text
        private long timestamp;
    }

    private String getHistoryKey(String tenantId) {
        return "chat:history:" + tenantId;
    }

    /**
     * Appends a message to the tenant's Redis conversation buffer.
     */
    public void appendMessage(String tenantId, String role, String content) {
        String key = getHistoryKey(tenantId);
        try {
            HistoryMessage msg = HistoryMessage.builder()
                    .role(role)
                    .content(content)
                    .timestamp(System.currentTimeMillis())
                    .build();

            String json = objectMapper.writeValueAsString(msg);
            redisTemplate.opsForList().rightPush(key, json);
            // Keep only the latest MAX_HISTORY_MESSAGES
            redisTemplate.opsForList().trim(key, -MAX_HISTORY_MESSAGES, -1);
            redisTemplate.expire(key, HISTORY_TTL);
        } catch (Exception e) {
            log.warn("Failed to append message to Redis chat history: {}", e.getMessage());
        }
    }

    /**
     * Retrieves the recent conversation history for prompt augmentation.
     */
    public List<HistoryMessage> getHistory(String tenantId) {
        String key = getHistoryKey(tenantId);
        List<HistoryMessage> history = new ArrayList<>();
        try {
            List<String> rawList = redisTemplate.opsForList().range(key, 0, -1);
            if (rawList != null) {
                for (String raw : rawList) {
                    try {
                        history.add(objectMapper.readValue(raw, HistoryMessage.class));
                    } catch (JsonProcessingException e) {
                        log.warn("Could not parse history message: {}", raw);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve chat history from Redis: {}", e.getMessage());
        }
        return history;
    }

    /**
     * Formats recent conversation history as a text block for prompt injection.
     */
    public String getFormattedHistory(String tenantId) {
        List<HistoryMessage> messages = getHistory(tenantId);
        if (messages.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Recent Conversation History:\n");
        for (HistoryMessage msg : messages) {
            String sender = "user".equalsIgnoreCase(msg.getRole()) ? "User" : "Assistant";
            sb.append(sender).append(": ").append(msg.getContent()).append("\n");
        }
        sb.append("\n");
        return sb.toString();
    }

    /**
     * Clears the tenant's chat history buffer in Redis.
     */
    public void clearHistory(String tenantId) {
        String key = getHistoryKey(tenantId);
        try {
            redisTemplate.delete(key);
            log.info("Cleared Redis chat history for tenant {}", tenantId);
        } catch (Exception e) {
            log.warn("Failed to clear Redis chat history: {}", e.getMessage());
        }
    }
}
