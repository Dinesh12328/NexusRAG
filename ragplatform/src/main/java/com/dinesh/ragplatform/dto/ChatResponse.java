package com.dinesh.ragplatform.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private String answer;           // AI generated answer
    private List<String> sources;    // which files were used
    private int chunksUsed;          // how many chunks retrieved
    private String tenantId;         // who asked
}