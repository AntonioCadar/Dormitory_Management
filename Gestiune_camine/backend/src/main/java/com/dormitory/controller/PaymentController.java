package com.dormitory.controller;

import com.dormitory.dto.PaymentDTO;
import com.dormitory.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentDTO>> getAllPayments(
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role) && !"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/my-payments")
    public ResponseEntity<List<PaymentDTO>> getMyPayments(
            @RequestHeader(value = "X-User-Id") Long userId) {

        return ResponseEntity.ok(paymentService.getStudentPayments(userId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByStudentId(
            @PathVariable Long studentId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role) && !"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(paymentService.getPaymentsByStudentId(studentId));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<Void> markAsPaid(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        // Only CASIERIE can mark payments as paid
        if (!"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        paymentService.markAsPaid(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate")
    public ResponseEntity<PaymentDTO> generatePayment(
            @RequestParam Long studentId,
            @RequestParam String type,
            @RequestParam Double amount,
            @RequestParam String dueDate,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        // Both ADMINISTRATOR and CASIERIE can generate payments
        if (!"ADMINISTRATOR".equals(role) && !"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        PaymentDTO payment = paymentService.generatePayment(
                studentId, type, amount, LocalDate.parse(dueDate));
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/generate-monthly-rent")
    public ResponseEntity<String> generateMonthlyRent(
            @RequestParam Long studentId,
            @RequestParam(defaultValue = "2025") int year,
            @RequestParam(defaultValue = "350") Double monthlyAmount,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        // Both ADMINISTRATOR and CASIERIE can generate monthly rent
        if (!"ADMINISTRATOR".equals(role) && !"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        paymentService.generateMonthlyRentPayments(studentId, year, monthlyAmount);
        return ResponseEntity.ok("Monthly rent payments generated for year " + year);
    }
}
