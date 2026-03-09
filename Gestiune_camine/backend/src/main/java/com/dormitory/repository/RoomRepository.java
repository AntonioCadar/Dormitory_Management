package com.dormitory.repository;

import com.dormitory.domain.entity.Room;
import com.dormitory.domain.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByDormitoryId(Long dormitoryId);

    List<Room> findByStatus(RoomStatus status);
}
