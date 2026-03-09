package com.dormitory.repository;

import com.dormitory.domain.entity.RepairRequest;
import com.dormitory.domain.enums.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepairRequestRepository extends JpaRepository<RepairRequest, Long> {
    List<RepairRequest> findByReporterId(Long reporterId);

    List<RepairRequest> findByStatus(RepairStatus status);

    List<RepairRequest> findByRoomId(Long roomId);

    @Query("SELECT r FROM RepairRequest r LEFT JOIN FETCH r.room rm LEFT JOIN FETCH rm.dormitory LEFT JOIN FETCH r.reporter ORDER BY r.createdAt DESC")
    List<RepairRequest> findAllWithDetails();

    @Query("SELECT r FROM RepairRequest r LEFT JOIN FETCH r.room rm LEFT JOIN FETCH rm.dormitory LEFT JOIN FETCH r.reporter WHERE r.room.id = :roomId ORDER BY r.createdAt DESC")
    List<RepairRequest> findByRoomIdWithDetails(@Param("roomId") Long roomId);

    @Query("SELECT r FROM RepairRequest r LEFT JOIN FETCH r.room rm LEFT JOIN FETCH rm.dormitory LEFT JOIN FETCH r.reporter WHERE r.id = :id")
    Optional<RepairRequest> findByIdWithDetails(@Param("id") Long id);
}
