package com.dormitory.service;

import com.dormitory.domain.entity.*;
import com.dormitory.domain.enums.RepairStatus;
import com.dormitory.dto.RepairMessageDTO;
import com.dormitory.dto.RepairRequestDTO;
import com.dormitory.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RepairService {

    private final RepairRequestRepository requestRepository;
    private final RepairMessageRepository messageRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;

    public RepairService(RepairRequestRepository requestRepository,
            RepairMessageRepository messageRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoomAssignmentRepository roomAssignmentRepository) {
        this.requestRepository = requestRepository;
        this.messageRepository = messageRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roomAssignmentRepository = roomAssignmentRepository;
    }

    // Get all requests - for HANDYMAN
    public List<RepairRequestDTO> getAllRequests() {
        return requestRepository.findAllWithDetails().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Get requests for student's room
    public List<RepairRequestDTO> getStudentRoomRequests(Long userId) {
        // Find student by user ID
        Student student = studentRepository.findByUserId(userId).orElse(null);
        if (student == null) {
            return List.of();
        }

        // Find active room assignment
        RoomAssignment assignment = roomAssignmentRepository
                .findByStudentIdAndIsActiveTrue(student.getId())
                .orElse(null);
        if (assignment == null) {
            return List.of();
        }

        // Return requests for that room
        return requestRepository.findByRoomIdWithDetails(assignment.getRoom().getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Create a new repair request - for STUDENT
    public RepairRequestDTO createRequest(Long userId, String title, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Find student and their room
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        RoomAssignment assignment = roomAssignmentRepository
                .findByStudentIdAndIsActiveTrue(student.getId())
                .orElseThrow(() -> new RuntimeException("No active room assignment"));

        RepairRequest request = new RepairRequest();
        request.setReporter(user);
        request.setRoom(assignment.getRoom());
        request.setTitle(title);
        request.setDescription(description);
        request.setLocation("Camera " + assignment.getRoom().getRoomNumber());
        request.setStatus(RepairStatus.PENDING);

        RepairRequest saved = requestRepository.save(request);

        // Reload with details
        return toDTO(requestRepository.findByIdWithDetails(saved.getId()).orElse(saved));
    }

    // Update status - for HANDYMAN only
    public void updateStatus(Long requestId, RepairStatus status) {
        RepairRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Repair request not found"));

        request.setStatus(status);

        if (status == RepairStatus.COMPLETED) {
            request.setCompletedAt(LocalDateTime.now());
        }

        requestRepository.save(request);
    }

    // Add comment to a request
    public RepairMessageDTO addComment(Long requestId, Long userId, String message) {
        RepairRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Repair request not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RepairMessage comment = new RepairMessage();
        comment.setRepairRequest(request);
        comment.setSender(user);
        comment.setMessage(message);

        RepairMessage saved = messageRepository.save(comment);
        return toMessageDTO(saved);
    }

    // Get comments for a request
    public List<RepairMessageDTO> getComments(Long requestId) {
        return messageRepository.findByRepairRequestIdOrderBySentAtAsc(requestId)
                .stream()
                .map(this::toMessageDTO)
                .collect(Collectors.toList());
    }

    // Convert entity to DTO
    private RepairRequestDTO toDTO(RepairRequest request) {
        RepairRequestDTO dto = new RepairRequestDTO();
        dto.setId(request.getId());
        dto.setTitle(request.getTitle());
        dto.setDescription(request.getDescription());
        dto.setLocation(request.getLocation());
        dto.setStatus(request.getStatus().name());
        dto.setPriority(request.getPriority() != null ? request.getPriority().name() : null);
        dto.setCreatedAt(request.getCreatedAt());
        dto.setCompletedAt(request.getCompletedAt());

        if (request.getRoom() != null) {
            dto.setRoomId(request.getRoom().getId());
            dto.setRoomNumber(request.getRoom().getRoomNumber());
            if (request.getRoom().getDormitory() != null) {
                dto.setDormitoryName(request.getRoom().getDormitory().getName());
            }
        }

        if (request.getReporter() != null) {
            dto.setReporterId(request.getReporter().getId());
            dto.setReporterName(request.getReporter().getFullName());
        }

        return dto;
    }

    // Convert message entity to DTO
    private RepairMessageDTO toMessageDTO(RepairMessage message) {
        RepairMessageDTO dto = new RepairMessageDTO();
        dto.setId(message.getId());
        dto.setMessage(message.getMessage());
        dto.setSentAt(message.getSentAt());

        if (message.getSender() != null) {
            dto.setSenderId(message.getSender().getId());
            dto.setSenderName(message.getSender().getFullName());
        }

        return dto;
    }
}
