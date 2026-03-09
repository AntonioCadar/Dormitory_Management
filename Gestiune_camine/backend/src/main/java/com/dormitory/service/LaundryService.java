package com.dormitory.service;

import com.dormitory.domain.entity.LaundryBooking;
import com.dormitory.dto.LaundryBookingDTO;
import com.dormitory.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LaundryService {

    private final LaundryBookingRepository bookingRepository;
    private final LaundryMachineRepository machineRepository;
    private final StudentRepository studentRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;

    public LaundryService(LaundryBookingRepository bookingRepository, LaundryMachineRepository machineRepository,
            StudentRepository studentRepository, RoomAssignmentRepository roomAssignmentRepository) {
        this.bookingRepository = bookingRepository;
        this.machineRepository = machineRepository;
        this.studentRepository = studentRepository;
        this.roomAssignmentRepository = roomAssignmentRepository;
    }

    public List<LaundryBookingDTO> getAllBookings() {
        List<LaundryBooking> bookings = bookingRepository.findAllWithDetails();
        return bookings.stream()
                .map(booking -> toDTO(booking, null))
                .collect(Collectors.toList());
    }

    public List<LaundryBookingDTO> getAllBookingsWithOwnership(Long currentUserId) {
        // Get current user's room number and dormitory
        String currentUserRoomNumber = null;
        Long currentDormitoryId = null;

        try {
            var student = studentRepository.findByUserId(currentUserId);
            if (student.isPresent()) {
                var roomAssignment = roomAssignmentRepository.findByStudentIdAndIsActiveTrue(student.get().getId());
                if (roomAssignment.isPresent()) {
                    org.hibernate.Hibernate.initialize(roomAssignment.get().getRoom());
                    currentUserRoomNumber = roomAssignment.get().getRoom().getRoomNumber();
                    // Get dormitory ID from the room
                    org.hibernate.Hibernate.initialize(roomAssignment.get().getRoom().getDormitory());
                    currentDormitoryId = roomAssignment.get().getRoom().getDormitory().getId();
                }
            }
        } catch (Exception e) {
            // Ignore if user is not a student
        }

        // If no dormitory found, return empty list
        if (currentDormitoryId == null) {
            return java.util.Collections.emptyList();
        }

        // Fetch only bookings from user's dormitory
        List<LaundryBooking> bookings = bookingRepository.findByDormitoryIdWithDetails(currentDormitoryId);

        final String userRoom = currentUserRoomNumber;
        return bookings.stream()
                .map(booking -> toDTOWithRoom(booking, userRoom))
                .collect(Collectors.toList());
    }

    public List<LaundryBookingDTO> getStudentBookings(Long userId) {
        var student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return bookingRepository.findByStudentId(student.getId()).stream()
                .map(booking -> toDTO(booking, student.getId()))
                .collect(Collectors.toList());
    }

    public LaundryBooking createBooking(Long userId, Long machineId, LocalDateTime startTime, LocalDateTime endTime) {
        var student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        var machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found"));

        LaundryBooking booking = new LaundryBooking();
        booking.setStudent(student);
        booking.setMachine(machine);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setIsCancelled(false);

        return bookingRepository.save(booking);
    }

    public void cancelBooking(Long bookingId) {
        LaundryBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setIsCancelled(true);
        bookingRepository.save(booking);
    }

    // DTO conversion with room-based ownership check
    private LaundryBookingDTO toDTOWithRoom(LaundryBooking booking, String currentUserRoomNumber) {
        LaundryBookingDTO dto = new LaundryBookingDTO();
        dto.setId(booking.getId());
        dto.setStudentId(booking.getStudent().getId());
        dto.setStudentName(booking.getStudent().getUser().getFullName());

        // Get room number from the booking's student
        String bookingRoomNumber = null;
        var roomAssignment = roomAssignmentRepository.findByStudentIdAndIsActiveTrue(booking.getStudent().getId());
        if (roomAssignment.isPresent()) {
            org.hibernate.Hibernate.initialize(roomAssignment.get().getRoom());
            bookingRoomNumber = roomAssignment.get().getRoom().getRoomNumber();
            dto.setRoomNumber(bookingRoomNumber);
        }

        dto.setMachineId(booking.getMachine().getId());
        dto.setMachineNumber(booking.getMachine().getMachineNumber());

        // Format timestamps
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                .ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        dto.setStartTime(booking.getStartTime() != null ? booking.getStartTime().format(formatter) : null);
        dto.setEndTime(booking.getEndTime() != null ? booking.getEndTime().format(formatter) : null);

        dto.setIsCancelled(booking.getIsCancelled());

        // Check if booking is from same room (roommates see green)
        if (currentUserRoomNumber != null && bookingRoomNumber != null) {
            dto.setIsOwn(currentUserRoomNumber.equals(bookingRoomNumber));
        } else {
            dto.setIsOwn(false);
        }

        return dto;
    }

    // Simple DTO conversion without room comparison
    private LaundryBookingDTO toDTO(LaundryBooking booking, Long currentStudentId) {
        LaundryBookingDTO dto = new LaundryBookingDTO();
        dto.setId(booking.getId());
        dto.setStudentId(booking.getStudent().getId());
        dto.setStudentName(booking.getStudent().getUser().getFullName());

        // Get room number
        var roomAssignment = roomAssignmentRepository.findByStudentIdAndIsActiveTrue(booking.getStudent().getId());
        if (roomAssignment.isPresent()) {
            org.hibernate.Hibernate.initialize(roomAssignment.get().getRoom());
            dto.setRoomNumber(roomAssignment.get().getRoom().getRoomNumber());
        }

        dto.setMachineId(booking.getMachine().getId());
        dto.setMachineNumber(booking.getMachine().getMachineNumber());

        // Format timestamps
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                .ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        dto.setStartTime(booking.getStartTime() != null ? booking.getStartTime().format(formatter) : null);
        dto.setEndTime(booking.getEndTime() != null ? booking.getEndTime().format(formatter) : null);

        dto.setIsCancelled(booking.getIsCancelled());

        // Simple student ID comparison
        if (currentStudentId != null) {
            dto.setIsOwn(booking.getStudent().getId().equals(currentStudentId));
        }

        return dto;
    }

    public List<java.util.Map<String, Object>> getMachinesForStudent(Long userId) {
        // Get student's dormitory
        var student = studentRepository.findByUserId(userId).orElse(null);
        if (student == null) {
            return java.util.Collections.emptyList();
        }

        var roomAssignment = roomAssignmentRepository.findByStudentIdAndIsActiveTrue(student.getId()).orElse(null);
        if (roomAssignment == null || roomAssignment.getRoom() == null) {
            return java.util.Collections.emptyList();
        }

        Long dormitoryId = roomAssignment.getRoom().getDormitory().getId();

        // Get machines for this dormitory
        var machines = machineRepository.findByDormitoryId(dormitoryId);

        return machines.stream()
                .filter(m -> m.getMachineNumber().startsWith("Etaj")) // Only floor machines
                .map(m -> {
                    java.util.Map<String, Object> machineMap = new java.util.HashMap<>();
                    machineMap.put("id", m.getId());
                    machineMap.put("name", m.getMachineNumber());
                    return machineMap;
                })
                .collect(Collectors.toList());
    }
}
