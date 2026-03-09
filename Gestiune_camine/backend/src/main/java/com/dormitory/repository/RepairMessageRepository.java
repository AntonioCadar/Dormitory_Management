package com.dormitory.repository;

import com.dormitory.domain.entity.RepairMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RepairMessageRepository extends JpaRepository<RepairMessage, Long> {
    List<RepairMessage> findByRepairRequestIdOrderBySentAtAsc(Long repairRequestId);

    List<RepairMessage> findBySenderId(Long senderId);
}
