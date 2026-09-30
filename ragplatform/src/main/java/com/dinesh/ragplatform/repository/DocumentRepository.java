package com.dinesh.ragplatform.repository;

import com.dinesh.ragplatform.model.DocumentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository
        extends JpaRepository<DocumentMetadata, UUID> {

    // get all documents for a specific tenant
    List<DocumentMetadata> findByTenantId(String tenantId);

    // count documents per tenant
    long countByTenantId(String tenantId);

    // delete single document for a tenant
    void deleteByIdAndTenantId(UUID id, String tenantId);

    // delete all documents for a tenant
    void deleteByTenantId(String tenantId);
}