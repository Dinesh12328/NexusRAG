package com.dinesh.ragplatform.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ChunkingService {

    // for a resume — 1000 chars per chunk is plenty
    private static final int CHUNK_SIZE = 1000;

    // overlap to keep context between chunks
    private static final int OVERLAP_SIZE = 100;

    // safety limit — resume never needs more than 20 chunks
    private static final int MAX_CHUNKS = 20;

    public List<String> chunkText(String text) {

        List<String> chunks = new ArrayList<>();

        // guard — empty text
        if (text == null || text.isBlank()) {
            log.warn("Empty text received");
            return chunks;
        }

        // clean whitespace
        text = text.replaceAll("\\s+", " ").trim();

        log.info("Chunking text of {} characters", text.length());

        // small text — return as single chunk
        if (text.length() <= CHUNK_SIZE) {
            chunks.add(text);
            log.info("Small text — 1 chunk created");
            return chunks;
        }

        int start = 0;

        while (start < text.length()) {

            // safety — never exceed max chunks
            if (chunks.size() >= MAX_CHUNKS) {
                log.warn("Max chunks ({}) reached, stopping",
                        MAX_CHUNKS);
                break;
            }

            // calculate end of this chunk
            int end = Math.min(start + CHUNK_SIZE,
                    text.length());

            // try to end at a sentence boundary
            if (end < text.length()) {
                int lastPeriod   = text.lastIndexOf('.', end);
                int lastNewline  = text.lastIndexOf('\n', end);
                int boundary = Math.max(lastPeriod, lastNewline);

                // only use boundary if it's reasonably close
                if (boundary > start + (CHUNK_SIZE / 2)) {
                    end = boundary + 1;
                }
            }

            // add the chunk
            String chunk = text.substring(start, end).trim();
            if (!chunk.isBlank()) {
                chunks.add(chunk);
                log.info("Chunk {} created ({} chars)",
                        chunks.size(), chunk.length());
            }

            // ✅ KEY FIX — always move forward
            // next start = end minus overlap
            int nextStart = end - OVERLAP_SIZE;

            // ✅ INFINITE LOOP FIX
            // if nextStart didn't move forward → force it forward
            if (nextStart <= start) {
                nextStart = end;
            }

            start = nextStart;
        }

        log.info("Chunking complete — {} chunks total",
                chunks.size());
        return chunks;
    }
}