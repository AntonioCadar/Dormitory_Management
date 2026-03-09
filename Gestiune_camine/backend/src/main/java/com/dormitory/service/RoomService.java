package com.dormitory.service;

import com.dormitory.domain.entity.Room;
import com.dormitory.domain.entity.RoomAssignment;
import com.dormitory.domain.entity.Student;
import com.dormitory.dto.RoomDTO;
import com.dormitory.dto.StudentDTO;
import com.dormitory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final StudentRepository studentRepository;

    public RoomService(RoomRepository roomRepository, RoomAssignmentRepository roomAssignmentRepository,
            StudentRepository studentRepository) {
        this.roomRepository = roomRepository;
        this.roomAssignmentRepository = roomAssignmentRepository;
        this.studentRepository = studentRepository;
    }

    public List<RoomDTO> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public RoomDTO getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return toDTO(room);
    }

    public RoomDTO getStudentRoom(Long userId) {
        // Find student by userId
        var student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Find active room assignment
        RoomAssignment assignment = roomAssignmentRepository
                .findByStudentIdAndIsActiveTrue(student.getId())
                .orElseThrow(() -> new RuntimeException("No active room assignment"));

        return toDTO(assignment.getRoom());
    }

    public void recalculateAllOccupancies() {
        List<Room> rooms = roomRepository.findAll();
        for (Room room : rooms) {
            // Count active assignments for this room
            long activeCount = roomAssignmentRepository.findAll().stream()
                    .filter(assignment -> assignment.getIsActive() &&
                            assignment.getRoom().getId().equals(room.getId()))
                    .count();

            room.setCurrentOccupancy((int) activeCount);
            roomRepository.save(room);
        }
    }

    private RoomDTO toDTO(Room room) {
        RoomDTO dto = new RoomDTO();
        dto.setId(room.getId());
        dto.setRoomNumber(room.getRoomNumber());
        dto.setFloor(room.getFloor());
        dto.setCapacity(room.getCapacity());
        dto.setCurrentOccupancy(room.getCurrentOccupancy());
        dto.setStatus(room.getStatus() != null ? room.getStatus().name() : "UNKNOWN");

        if (room.getDormitory() != null) {
            dto.setDormitoryId(room.getDormitory().getId());
            dto.setDormitoryName(room.getDormitory().getName());
        }

        return dto;
    }

    public List<StudentDTO> getStudentsByRoomId(Long roomId) {
        List<RoomAssignment> activeAssignments = roomAssignmentRepository
                .findActiveAssignmentsByRoomIdWithStudent(roomId);

        return activeAssignments.stream()
                .map(assignment -> {
                    Student student = assignment.getStudent();
                    StudentDTO dto = new StudentDTO();
                    dto.setId(student.getId());
                    dto.setFullName(student.getUser().getFullName());
                    dto.setEmail(student.getUser().getEmail());
                    dto.setPhone(student.getUser().getPhone());
                    dto.setCnp(student.getCnp());
                    dto.setYear(student.getYear());
                    dto.setGroupName(student.getGroupName());
                    if (student.getFaculty() != null) {
                        dto.setFacultyName(student.getFaculty().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
