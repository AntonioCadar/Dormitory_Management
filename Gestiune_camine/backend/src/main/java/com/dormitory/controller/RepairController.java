package com.dormitory.controller;

import com.dormitory.domain.enums.RepairStatus;
import com.dormitory.dto.RepairMessageDTO;
import com.dormitory.dto.RepairRequestDTO;
import com.dormitory.service.RepairService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repairs")
@CrossOrigin(origins = "*")
public class RepairController {

    private final RepairService repairService;

    public RepairController(RepairService repairService) {
        this.repairService = repairService;
    }

    // Get all requests - HANDYMAN only
    @GetMapping
    public ResponseEntity<List<RepairRequestDTO>> getAllRequests(
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"HANDYMAN".equals(role) && !"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(repairService.getAllRequests());
    }

    // Get requests for student's room
    @GetMapping("/my-room")
    public ResponseEntity<List<RepairRequestDTO>> getMyRoomRequests(
            @RequestHeader(value = "X-User-Id") Long userId) {

        return ResponseEntity.ok(repairService.getStudentRoomRequests(userId));
    }

    // Create new repair request - STUDENT
    @PostMapping
    public ResponseEntity<RepairRequestDTO> createRequest(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Id") Long userId) {

        String title = request.get("title");
        String description = request.get("description");

        RepairRequestDTO created = repairService.createRequest(userId, title, description);
        return ResponseEntity.ok(created);
    }

    // Update status - HANDYMAN only
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"HANDYMAN".equals(role) && !"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        String status = request.get("status");
        repairService.updateStatus(id, RepairStatus.valueOf(status));
        return ResponseEntity.ok().build();
    }

    // Get comments for a request
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<RepairMessageDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(repairService.getComments(id));
    }

    // Add comment to a request
    @PostMapping("/{id}/comments")
    public ResponseEntity<RepairMessageDTO> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-User-Id") Long userId) {

        String message = request.get("message");
        RepairMessageDTO created = repairService.addComment(id, userId, message);
        return ResponseEntity.ok(created);
    }
}
