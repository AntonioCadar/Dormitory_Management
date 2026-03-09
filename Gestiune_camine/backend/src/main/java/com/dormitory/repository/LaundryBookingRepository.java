package com.dormitory.repository;

import com.dormitory.domain.entity.LaundryBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LaundryBookingRepository extends JpaRepository<LaundryBooking, Long> {
        List<LaundryBooking> findByStudentId(Long studentId);

        List<LaundryBooking> findByMachineIdAndIsCancelledFalse(Long machineId);

        List<LaundryBooking> findByMachineIdAndStartTimeBetweenAndIsCancelledFalse(
                        Long machineId, LocalDateTime start, LocalDateTime end);

        // Optimized query with JOIN FETCH to avoid N+1 problem
        @Query("SELECT DISTINCT lb FROM LaundryBooking lb " +
                        "LEFT JOIN FETCH lb.student s " +
                        "LEFT JOIN FETCH s.user " +
                        "LEFT JOIN FETCH lb.machine")
        List<LaundryBooking> findAllWithDetails();

        // Find bookings by dormitory - for filtering by student's dormitory
        @Query("SELECT DISTINCT lb FROM LaundryBooking lb " +
                        "LEFT JOIN FETCH lb.student s " +
                        "LEFT JOIN FETCH s.user " +
                        "LEFT JOIN FETCH lb.machine m " +
                        "WHERE m.dormitory.id = :dormitoryId")
        List<LaundryBooking> findByDormitoryIdWithDetails(Long dormitoryId);
}
