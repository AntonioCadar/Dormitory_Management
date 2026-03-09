package com.dormitory.repository;

import com.dormitory.domain.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);

    Optional<Student> findByCnp(String cnp);

    boolean existsByCnp(String cnp);
}
