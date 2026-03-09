package com.dormitory.repository;

import com.dormitory.domain.entity.RoomAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, Long> {
    List<RoomAssignment> findByStudentId(Long studentId);

    List<RoomAssignment> findByRoomId(Long roomId);

    List<RoomAssignment> findByIsActiveTrue();

    Optional<RoomAssignment> findByStudentIdAndIsActiveTrue(Long studentId);

    @Query("SELECT ra FROM RoomAssignment ra JOIN FETCH ra.student s JOIN FETCH s.user WHERE ra.room.id = :roomId AND ra.isActive = true")
    List<RoomAssignment> findActiveAssignmentsByRoomIdWithStudent(@Param("roomId") Long roomId);
}
