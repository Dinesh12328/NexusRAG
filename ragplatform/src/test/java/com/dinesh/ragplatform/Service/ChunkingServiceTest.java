package com.dinesh.ragplatform.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChunkingServiceTest {

    private ChunkingService chunkingService;

    @BeforeEach
    void setUp() {
        chunkingService = new ChunkingService();
    }

    @Test
    @DisplayName("Should return empty list for null, empty, or blank text")
    void testEmptyOrNullText() {
        assertThat(chunkingService.chunkText(null)).isEmpty();
        assertThat(chunkingService.chunkText("")).isEmpty();
        assertThat(chunkingService.chunkText("   \n\t  ")).isEmpty();
    }

    @Test
    @DisplayName("Should return single chunk for short text under 1000 characters")
    void testShortTextReturnsSingleChunk() {
        String shortText = "NexusRAG is an enterprise-grade multi-tenant RAG platform.";
        List<String> chunks = chunkingService.chunkText(shortText);

        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).isEqualTo(shortText);
    }

    @Test
    @DisplayName("Should split long text into multiple chunks with overlap")
    void testLongTextChunking() {
        // Create text with multiple sentences totaling ~2500 characters
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 25; i++) {
            sb.append("Sentence ").append(i).append(": This is sample text to test semantic chunking behavior and sentence boundary alignment. ");
        }
        String longText = sb.toString();

        List<String> chunks = chunkingService.chunkText(longText);

        assertThat(chunks).isNotEmpty();
        assertThat(chunks.size()).isGreaterThan(1);
        // All chunks should have non-empty content
        for (String chunk : chunks) {
            assertThat(chunk).isNotBlank();
        }
    }

    @Test
    @DisplayName("Should not exceed maximum 20 chunks safeguard")
    void testMaxChunksSafeguard() {
        // Generate very large text (~50,000 characters)
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 500; i++) {
            sb.append("Section ").append(i).append(" contains repeated document metadata information and content details for testing. ");
        }

        List<String> chunks = chunkingService.chunkText(sb.toString());

        assertThat(chunks.size()).isLessThanOrEqualTo(20);
    }
}
