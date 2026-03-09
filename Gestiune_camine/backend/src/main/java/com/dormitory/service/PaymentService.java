package com.dormitory.service;

import com.dormitory.domain.entity.Payment;
import com.dormitory.domain.enums.PaymentStatus;
import com.dormitory.dto.PaymentDTO;
import com.dormitory.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final StudentRepository studentRepository;

    public PaymentService(PaymentRepository paymentRepository, StudentRepository studentRepository) {
        this.paymentRepository = paymentRepository;
        this.studentRepository = studentRepository;
    }

    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO> getStudentPayments(Long userId) {
        var student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return paymentRepository.findByStudentId(student.getId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO> getPaymentsByStudentId(Long studentId) {
        return paymentRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Admin: Mark payment as paid
    public void markAsPaid(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidDate(LocalDate.now());
        paymentRepository.save(payment);
    }

    // Admin: Generate new payment obligation
    public PaymentDTO generatePayment(Long studentId, String type, Double amount, LocalDate dueDate) {
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Payment payment = new Payment();
        payment.setStudent(student);
        payment.setPaymentType(type);
        payment.setAmount(amount);
        payment.setDueDate(dueDate);
        payment.setStatus(PaymentStatus.PENDING);

        Payment saved = paymentRepository.save(payment);
        return toDTO(saved);
    }

    // Generate monthly rent payments for an entire year
    public void generateMonthlyRentPayments(Long studentId, int year, Double monthlyAmount) {
        var student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String[] monthNames = { "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie" };

        for (int month = 1; month <= 12; month++) {
            // Check if payment already exists for this month
            String paymentType = "Regie " + monthNames[month - 1] + " " + year;
            boolean exists = paymentRepository.findByStudentId(studentId).stream()
                    .anyMatch(p -> paymentType.equals(p.getPaymentType()));

            if (!exists) {
                Payment payment = new Payment();
                payment.setStudent(student);
                payment.setPaymentType(paymentType);
                payment.setAmount(monthlyAmount);
                payment.setDueDate(LocalDate.of(year, month, 15)); // Due on 15th of each month
                payment.setStatus(PaymentStatus.PENDING);
                paymentRepository.save(payment);
            }
        }
    }

    private PaymentDTO toDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.setId(payment.getId());
        dto.setStudentId(payment.getStudent().getId());
        dto.setStudentName(payment.getStudent().getUser().getFullName());
        dto.setAmount(payment.getAmount());
        dto.setPaymentType(payment.getPaymentType());
        dto.setDueDate(payment.getDueDate() != null ? payment.getDueDate().toString() : null);
        dto.setPaidDate(payment.getPaidDate() != null ? payment.getPaidDate().toString() : null);
        dto.setStatus(payment.getStatus() != null ? payment.getStatus().name() : "UNKNOWN");
        return dto;
    }
}
