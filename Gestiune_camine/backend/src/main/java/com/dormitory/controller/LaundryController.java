package com.dormitory.controller;

import com.dormitory.dto.LaundryBookingDTO;
import com.dormitory.domain.entity.LaundryBooking;
import com.dormitory.service.LaundryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/laundry")
@CrossOrigin(origins = "*")
public class LaundryController {

    private final LaundryService laundryService;

    public LaundryController(LaundryService laundryService) {
        this.laundryService = laundryService;
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<LaundryBookingDTO>> getAllBookings(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        // Allow all authenticated users to see bookings (needed for calendar view)
        // If userId is provided, we can mark own bookings
        if (userId != null) {
            return ResponseEntity.ok(laundryService.getAllBookingsWithOwnership(userId));
        }

        return ResponseEntity.ok(laundryService.getAllBookings());
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<LaundryBookingDTO>> getMyBookings(
            @RequestHeader(value = "X-User-Id") Long userId) {

        return ResponseEntity.ok(laundryService.getStudentBookings(userId));
    }

    @PostMapping("/book")
    public ResponseEntity<String> createBooking(
            @RequestParam Long machineId,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestHeader(value = "X-User-Id") Long userId) {

        laundryService.createBooking(
                userId,
                machineId,
                LocalDateTime.parse(startTime),
                LocalDateTime.parse(endTime));
        return ResponseEntity.ok("Booking created successfully");
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        laundryService.cancelBooking(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/machines")
    public ResponseEntity<?> getMachinesForStudent(
            @RequestHeader(value = "X-User-Id") Long userId) {
        return ResponseEntity.ok(laundryService.getMachinesForStudent(userId));
    }
}
