package com.dinesh.ragplatform.controller;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class RagController {

    private final VectorStore vectorStore;

    public RagController(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    // 1. Endpoint to add sample text to your Neon database
    @GetMapping("/add")
    public String addDocument(@RequestParam(value = "message", defaultValue = "Hello, my name is Dinesh and I am building a RAG platform.") String message) {
        Document document = new Document(message, Map.of("author", "Dinesh"));
        vectorStore.add(List.of(document));
        return "Success! Document added and embedded: " + message;
    }

    // 2. Endpoint to search the vector database semantically
    @GetMapping("/search")
    public List<Document> searchDocuments(@RequestParam(value = "query") String query) {
        SearchRequest searchRequest = SearchRequest.builder()
                .query(query)
                .topK(3)
                .build();
        return vectorStore.similaritySearch(searchRequest);
    }
}