package com.dinesh.ragplatform.model;  // ✅ lowercase m

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class user {                    // ✅ uppercase U

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)  // ✅ UUID not IDENTITY
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.tenantId == null) {
            this.tenantId = this.username;
        }
    }
}