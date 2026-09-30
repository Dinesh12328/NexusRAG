package com.dinesh.ragplatform.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type")
    private String contentType;

    // how many chunks this doc was split into
    @Column(name = "chunk_count")
    private Integer chunkCount;

    // which user uploaded this
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "status")
    private String status;      // PROCESSING, COMPLETED, FAILED

    @PrePersist
    public void prePersist() {
        this.uploadedAt = LocalDateTime.now();
        this.status = "PROCESSING";
    }
}