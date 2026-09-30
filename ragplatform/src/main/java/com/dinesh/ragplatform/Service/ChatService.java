package com.dinesh.ragplatform.Service;

import com.dinesh.ragplatform.dto.ChatRequest;
import com.dinesh.ragplatform.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final RateLimiterService rateLimiterService;
    private final ChatHistoryService chatHistoryService;

    public ChatResponse chat(ChatRequest request,
                             String tenantId) {

        log.info("Question: '{}' from tenant: {}",
                request.getQuestion(), tenantId);

        // Step 0 — Rate limit check (protects Gemini quota via Redis)
        if (!rateLimiterService.tryAcquire(tenantId)) {
            return ChatResponse.builder()
                    .answer("⚠️ Rate limit reached (maximum " +
                            rateLimiterService.getMaxRequestsPerMinute() +
                            " requests per minute). Please wait 15-30 seconds before sending another question.")
                    .sources(List.of())
                    .chunksUsed(0)
                    .tenantId(tenantId)
                    .build();
        }

        // Step 1 — Search vector store with tenant filter (optimized topK=3 for speed)
        var filter = new FilterExpressionBuilder();

        SearchRequest searchRequest = SearchRequest.builder()
                .query(request.getQuestion())
                .topK(3)
                .similarityThreshold(0.3)
                .filterExpression(
                        filter.eq("tenant_id", tenantId).build())
                .build();

        List<Document> relevantDocs =
                vectorStore.similaritySearch(searchRequest);

        log.info("Found {} relevant chunks",
                relevantDocs.size());

        // Step 2 — No results found
        if (relevantDocs.isEmpty()) {
            String fallbackAnswer = "I could not find relevant information in your uploaded documents. Please upload relevant files first.";
            chatHistoryService.appendMessage(tenantId, "user", request.getQuestion());
            chatHistoryService.appendMessage(tenantId, "assistant", fallbackAnswer);

            return ChatResponse.builder()
                    .answer(fallbackAnswer)
                    .sources(List.of())
                    .chunksUsed(0)
                    .tenantId(tenantId)
                    .build();
        }

        // Step 3 — Build context from chunks
        StringBuilder context = new StringBuilder();
        for (int i = 0; i < relevantDocs.size(); i++) {
            context.append("--- Chunk ")
                    .append(i + 1)
                    .append(" ---\n")
                    .append(relevantDocs.get(i).getText())
                    .append("\n\n");
        }

        // Step 4 — Get source file names
        List<String> sources = relevantDocs.stream()
                .map(doc -> (String) doc.getMetadata()
                        .get("file_name"))
                .filter(name -> name != null)
                .distinct()
                .toList();

        // Step 5 — Build prompt with Redis conversation history
        String conversationHistory = chatHistoryService.getFormattedHistory(tenantId);

        String prompt = """
                Answer the question using the context and conversation history below.
                If the answer is not in the context, say "I don't have enough information to answer that."

                """ + conversationHistory + """
                Context from documents:
                """ + context + """

                Question: """ + request.getQuestion() + """

                Answer:""";

        // Step 6 — Call AI with retry
        log.info("Calling AI with {} chunks...", relevantDocs.size());

        String answer;
        try {
            answer = callAiWithRetry(prompt, 3);
            log.info("AI answered successfully");
            // Save to Redis conversation history
            chatHistoryService.appendMessage(tenantId, "user", request.getQuestion());
            chatHistoryService.appendMessage(tenantId, "assistant", answer);
        } catch (Exception e) {
            log.error("AI call failed after retries: {}", e.getMessage(), e);
            String errDetail = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (errDetail.contains("quota") || errDetail.contains("rate") || errDetail.contains("429") || errDetail.contains("resource_exhausted")) {
                answer = "⚠️ Google Gemini rate limit exceeded (HTTP 429). The free tier allows limited requests per minute. Please wait 10-15 seconds and try again.";
            } else if (errDetail.contains("safety") || errDetail.contains("blocked")) {
                answer = "⚠️ The question or document context was blocked by Google Gemini's safety filters. Please refine your query.";
            } else if (errDetail.contains("overloaded") || errDetail.contains("503") || errDetail.contains("unavailable")) {
                answer = "⚠️ Google Gemini service is temporarily overloaded. Please try asking again in a few moments.";
            } else {
                answer = "⚠️ Could not generate an answer right now: " + (e.getMessage() != null ? e.getMessage() : "Unknown AI error") + ". Please try again shortly.";
            }
        }

        // Step 7 — Return response
        return ChatResponse.builder()
                .answer(answer)
                .sources(sources)
                .chunksUsed(relevantDocs.size())
                .tenantId(tenantId)
                .build();
    }

    private String callAiWithRetry(String prompt, int maxAttempts) {
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("Calling Gemini AI (attempt {}/{})...", attempt, maxAttempts);
                String content = chatClient
                        .prompt()
                        .user(prompt)
                        .call()
                        .content();
                if (content != null && !content.isBlank()) {
                    return content;
                }
                log.warn("Gemini returned blank response on attempt {}", attempt);
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini call attempt {}/{} failed: {}", attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(1500L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Thread interrupted during AI retry", ie);
                    }
                }
            }
        }
        throw new RuntimeException(lastException != null ? lastException.getMessage() : "Failed to generate content from AI model", lastException);
    }

    public void clearHistory(String tenantId) {
        chatHistoryService.clearHistory(tenantId);
    }

    public List<ChatHistoryService.HistoryMessage> getHistory(String tenantId) {
        return chatHistoryService.getHistory(tenantId);
    }
}