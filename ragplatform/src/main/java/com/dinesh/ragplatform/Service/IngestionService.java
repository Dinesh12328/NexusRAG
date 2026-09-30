package com.dinesh.ragplatform.Service;

import com.dinesh.ragplatform.dto.UploadResponse;
import com.dinesh.ragplatform.model.DocumentMetadata;
import com.dinesh.ragplatform.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestionService {

    private final DocumentRepository documentRepository;
    private final ChunkingService chunkingService;
    private final VectorStore vectorStore;
    private final JdbcTemplate jdbcTemplate;

    private final Tika tika = new Tika();

    // max chars to read — enough for any resume
    private static final int MAX_CHARS = 50_000;

    // store in batches — don't send all to Gemini at once
    private static final int BATCH_SIZE = 5;

    public UploadResponse ingestDocument(
            MultipartFile file, String tenantId) {

        log.info("Starting ingestion: {} | tenant: {}",
                file.getOriginalFilename(), tenantId);

        // Step 1 — save receipt to DB
        DocumentMetadata metadata = DocumentMetadata.builder()
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .tenantId(tenantId)
                .build();
        metadata = documentRepository.save(metadata);

        try {
            // Step 2 — extract text with Tika
            // 50_000 char limit prevents OOM
            log.info("Extracting text with Tika...");
            String rawText = tika.parseToString(
                    file.getInputStream(),
                    new org.apache.tika.metadata.Metadata(),
                    MAX_CHARS);

            if (rawText == null || rawText.isBlank()) {
                throw new RuntimeException(
                        "No text found in file. " +
                                "Is it a scanned image PDF?");
            }

            log.info("Extracted {} characters", rawText.length());

            // Step 3 — chunk the text
            log.info("Chunking text...");
            List<String> chunks =
                    chunkingService.chunkText(rawText);
            log.info("Created {} chunks", chunks.size());

            // Step 4 — wrap chunks as Spring AI Documents
            List<Document> documents = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                documents.add(new Document(
                        chunks.get(i),
                        Map.of(
                                "tenant_id",    tenantId,
                                "file_name",    file.getOriginalFilename(),
                                "document_id",  metadata.getId().toString(),
                                "chunk_index",  String.valueOf(i),
                                "total_chunks", String.valueOf(chunks.size())
                        )
                ));
            }

            // Step 5 — store in pgvector in batches
            // batching avoids timeout on large documents
            log.info("Storing {} chunks in batches of {}...",
                    documents.size(), BATCH_SIZE);

            for (int i = 0; i < documents.size(); i += BATCH_SIZE) {
                int batchEnd = Math.min(
                        i + BATCH_SIZE, documents.size());
                List<Document> batch =
                        documents.subList(i, batchEnd);
                vectorStore.add(batch);
                log.info("Stored chunks {}/{}",
                        batchEnd, documents.size());
            }

            log.info("All chunks stored in pgvector");

            // Step 6 — update receipt as COMPLETED
            metadata.setChunkCount(chunks.size());
            metadata.setStatus("COMPLETED");
            documentRepository.save(metadata);

            return UploadResponse.builder()
                    .documentId(metadata.getId())
                    .fileName(file.getOriginalFilename())
                    .chunkCount(chunks.size())
                    .tenantId(tenantId)
                    .status("COMPLETED")
                    .message("Document ingested successfully")
                    .build();

        } catch (Exception e) {
            log.error("Ingestion failed: {}", e.getMessage());
            metadata.setStatus("FAILED");
            documentRepository.save(metadata);
            throw new RuntimeException(
                    "Failed to ingest: " + e.getMessage());
        }
    }

    public List<DocumentMetadata> getDocuments(String tenantId) {
        return documentRepository.findByTenantId(tenantId);
    }

    @Transactional
    public void deleteDocument(UUID documentId, String tenantId) {
        log.info("Deleting document {} for tenant {}", documentId, tenantId);
        try {
            jdbcTemplate.update(
                    "DELETE FROM vector_store WHERE metadata->>'document_id' = ? AND metadata->>'tenant_id' = ?",
                    documentId.toString(), tenantId);
        } catch (Exception e) {
            log.warn("Could not delete from vector_store (table might not exist yet): {}", e.getMessage());
        }
        documentRepository.deleteByIdAndTenantId(documentId, tenantId);
        log.info("Document {} deleted successfully", documentId);
    }

    @Transactional
    public void deleteAllDocuments(String tenantId) {
        log.info("Deleting all documents for tenant {}", tenantId);
        try {
            jdbcTemplate.update(
                    "DELETE FROM vector_store WHERE metadata->>'tenant_id' = ?",
                    tenantId);
        } catch (Exception e) {
            log.warn("Could not delete from vector_store (table might not exist yet): {}", e.getMessage());
        }
        documentRepository.deleteByTenantId(tenantId);
        log.info("All documents for tenant {} deleted successfully", tenantId);
    }
}