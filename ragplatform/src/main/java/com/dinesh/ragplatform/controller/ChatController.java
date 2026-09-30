package com.dinesh.ragplatform.controller;

import com.dinesh.ragplatform.Service.ChatHistoryService;
import com.dinesh.ragplatform.Service.ChatService;
import com.dinesh.ragplatform.dto.ChatRequest;
import com.dinesh.ragplatform.dto.ChatResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String tenantId = userDetails.getUsername();
        log.info("Chat request from: {}", tenantId);

        return ResponseEntity.ok(
                chatService.chat(request, tenantId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatHistoryService.HistoryMessage>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        String tenantId = userDetails.getUsername();
        return ResponseEntity.ok(chatService.getHistory(tenantId));
    }

    @DeleteMapping("/history")
    public ResponseEntity<Map<String, String>> clearHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        String tenantId = userDetails.getUsername();
        chatService.clearHistory(tenantId);
        return ResponseEntity.ok(Map.of("message", "Chat history cleared successfully"));
    }
}