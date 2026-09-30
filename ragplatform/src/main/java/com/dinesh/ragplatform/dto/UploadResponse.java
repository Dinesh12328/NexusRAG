package com.dinesh.ragplatform.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResponse {

    private UUID documentId;
    private String fileName;
    private int chunkCount;
    private String tenantId;
    private String status;
    private String message;
}