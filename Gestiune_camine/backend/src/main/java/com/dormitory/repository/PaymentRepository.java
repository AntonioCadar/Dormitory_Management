package com.dormitory.repository;

import com.dormitory.domain.entity.Payment;
import com.dormitory.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByStudentIdAndStatus(Long studentId, PaymentStatus status);
}
