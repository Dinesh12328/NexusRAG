package com.dinesh.ragplatform.controller;

import com.dinesh.ragplatform.dto.UploadResponse;
import com.dinesh.ragplatform.model.DocumentMetadata;
import com.dinesh.ragplatform.Service.IngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final IngestionService ingestionService;

    // POST /api/documents/upload
    // requires JWT token in Authorization header
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        // get tenantId from JWT (which is the username)
        String tenantId = userDetails.getUsername();

        log.info("Upload request from tenant: {}", tenantId);

        // validate file
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        UploadResponse response =
                ingestionService.ingestDocument(file, tenantId);

        return ResponseEntity.ok(response);
    }

    // GET /api/documents
    // list all documents for current user
    @GetMapping
    public ResponseEntity<List<DocumentMetadata>> getDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {

        String tenantId = userDetails.getUsername();
        return ResponseEntity.ok(
                ingestionService.getDocuments(tenantId));
    }

    // DELETE /api/documents/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        String tenantId = userDetails.getUsername();
        log.info("Delete request for document {} from tenant {}", id, tenantId);
        ingestionService.deleteDocument(id, tenantId);
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
    }

    // DELETE /api/documents/clear
    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, String>> clearAllDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {

        String tenantId = userDetails.getUsername();
        log.info("Clear all documents request from tenant {}", tenantId);
        ingestionService.deleteAllDocuments(tenantId);
        return ResponseEntity.ok(Map.of("message", "All documents deleted successfully"));
    }
}