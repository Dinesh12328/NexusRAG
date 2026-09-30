package com.dinesh.ragplatform.repository;

import com.dinesh.ragplatform.model.DocumentMetadata;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class DocumentRepositoryIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("pgvector/pgvector:pg16");

    @Autowired
    private DocumentRepository documentRepository;

    @Test
    @DisplayName("Should save, query by tenant, and delete document metadata in isolated PostgreSQL container")
    void testTenantDocumentIsolationAndDeletion() {
        // Arrange
        DocumentMetadata doc1 = DocumentMetadata.builder()
                .fileName("financial_report_2026.pdf")
                .fileSize(102400L)
                .contentType("application/pdf")
                .tenantId("tenant_finance")
                .chunkCount(8)
                .status("COMPLETED")
                .build();

        DocumentMetadata doc2 = DocumentMetadata.builder()
                .fileName("engineering_specs.pdf")
                .fileSize(204800L)
                .contentType("application/pdf")
                .tenantId("tenant_engineering")
                .chunkCount(12)
                .status("COMPLETED")
                .build();

        documentRepository.save(doc1);
        documentRepository.save(doc2);

        // Act & Assert: Isolation by tenant
        List<DocumentMetadata> financeDocs = documentRepository.findByTenantId("tenant_finance");
        assertThat(financeDocs).hasSize(1);
        assertThat(financeDocs.get(0).getFileName()).isEqualTo("financial_report_2026.pdf");

        List<DocumentMetadata> engDocs = documentRepository.findByTenantId("tenant_engineering");
        assertThat(engDocs).hasSize(1);
        assertThat(engDocs.get(0).getFileName()).isEqualTo("engineering_specs.pdf");

        // Act & Assert: Delete by tenant
        documentRepository.deleteByTenantId("tenant_finance");
        assertThat(documentRepository.findByTenantId("tenant_finance")).isEmpty();
        assertThat(documentRepository.findByTenantId("tenant_engineering")).hasSize(1);
    }
}
