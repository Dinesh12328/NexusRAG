package com.dinesh.ragplatform.repository;

import com.dinesh.ragplatform.model.user;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<user, UUID> {

Optional<user> findByUsername(String username);
Optional<user> findByEmail(String email);
boolean existsByUsername(String username);
boolean existsByEmail(String email);
}
