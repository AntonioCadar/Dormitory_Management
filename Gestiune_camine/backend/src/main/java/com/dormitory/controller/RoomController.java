package com.dormitory.controller;

import com.dormitory.dto.RoomDTO;
import com.dormitory.dto.StudentDTO;
import com.dormitory.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomDTO>> getAllRooms(
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDTO> getRoomById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping("/my-room")
    public ResponseEntity<RoomDTO> getMyRoom(
            @RequestHeader(value = "X-User-Id") Long userId) {

        try {
            return ResponseEntity.ok(roomService.getStudentRoom(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/recalculate-occupancy")
    public ResponseEntity<Void> recalculateOccupancy(
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        roomService.recalculateAllOccupancies();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<StudentDTO>> getStudentsByRoomId(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(roomService.getStudentsByRoomId(id));
    }
}
