package com.dinesh.ragplatform.dto;

import lombok.*;

// This is what we return to the user after register/login
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;      // the JWT token
    private String username;
    private String email;
    private String tenantId;
    private String message;    // success/error message
}