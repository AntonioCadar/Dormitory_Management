package com.dormitory.service;

import com.dormitory.domain.entity.Student;
import com.dormitory.domain.entity.RoomAssignment;
import com.dormitory.domain.entity.User;
import com.dormitory.domain.entity.UserRole;
import com.dormitory.domain.entity.Faculty;
import com.dormitory.domain.entity.Payment;
import com.dormitory.domain.enums.Role;
import com.dormitory.dto.StudentDTO;
import com.dormitory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final LaundryBookingRepository laundryBookingRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RepairRequestRepository repairRequestRepository;
    private final RepairMessageRepository repairMessageRepository;
    private final FacultyRepository facultyRepository;

    public StudentService(StudentRepository studentRepository,
            RoomAssignmentRepository roomAssignmentRepository,
            RoomRepository roomRepository,
            PaymentRepository paymentRepository,
            LaundryBookingRepository laundryBookingRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            RepairRequestRepository repairRequestRepository,
            RepairMessageRepository repairMessageRepository,
            FacultyRepository facultyRepository) {
        this.studentRepository = studentRepository;
        this.roomAssignmentRepository = roomAssignmentRepository;
        this.roomRepository = roomRepository;
        this.paymentRepository = paymentRepository;
        this.laundryBookingRepository = laundryBookingRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.repairRequestRepository = repairRequestRepository;
        this.repairMessageRepository = repairMessageRepository;
        this.facultyRepository = facultyRepository;
    }

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return toDTO(student);
    }

    public StudentDTO getStudentByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return toDTO(student);
    }

    // CRUD Operations for Admin
    public StudentDTO createStudent(StudentDTO dto) {
        // 1. Create User account
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(dto.getPassword());
        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setActive(true);
        User savedUser = userRepository.save(user);

        // 2. Assign STUDENT role
        UserRole studentRole = new UserRole();
        studentRole.setUser(savedUser);
        studentRole.setRole(Role.STUDENT);
        userRoleRepository.save(studentRole);

        // 3. Create Student profile
        Student student = new Student();
        student.setUser(savedUser);
        student.setCnp(dto.getCnp());
        student.setYear(dto.getYear());
        student.setGroupName(dto.getGroupName());

        // 4. Set faculty if provided
        if (dto.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                    .orElse(null);
            student.setFaculty(faculty);
        }

        Student saved = studentRepository.save(student);

        // 5. Auto-generate monthly rent payments for the new student
        generateMonthlyRentForStudent(saved.getId());

        return toDTO(saved);
    }

    public StudentDTO updateStudent(Long id, StudentDTO dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setYear(dto.getYear());
        student.setGroupName(dto.getGroupName());

        // Update CNP on Student entity
        if (dto.getCnp() != null) {
            student.setCnp(dto.getCnp());
        }

        // Update user fields including password if provided
        User user = student.getUser();
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getFullName() != null && !dto.getFullName().isEmpty()) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(dto.getPassword());
        }
        userRepository.save(user);

        Student updated = studentRepository.save(student);
        return toDTO(updated);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Get the associated user before deleting student
        User user = student.getUser();

        // 1. Delete all payments for this student
        paymentRepository.findByStudentId(id).forEach(payment -> paymentRepository.delete(payment));

        // 2. Delete all laundry bookings for this student
        laundryBookingRepository.findByStudentId(id).forEach(booking -> laundryBookingRepository.delete(booking));

        // 3. Delete all room assignments and update room occupancy
        roomAssignmentRepository.findByStudentId(id).forEach(assignment -> {
            if (assignment.getIsActive()) {
                // Decrement room occupancy
                com.dormitory.domain.entity.Room room = assignment.getRoom();
                Integer currentOcc = room.getCurrentOccupancy();
                if (currentOcc != null && currentOcc > 0) {
                    room.setCurrentOccupancy(currentOcc - 1);
                    roomRepository.save(room);
                }
            }
            roomAssignmentRepository.delete(assignment);
        });

        // 4. Delete the student
        studentRepository.delete(student);

        // 5. Handle the associated user
        if (user != null) {
            // Find or create "Unknown User" for preserving repair history
            User unknownUser = userRepository.findByEmail("unknown@system.local")
                    .orElseGet(() -> {
                        User newUnknown = new User();
                        newUnknown.setEmail("unknown@system.local");
                        newUnknown.setPassword("no-login");
                        newUnknown.setFullName("Utilizator Șters");
                        newUnknown.setActive(false);
                        return userRepository.save(newUnknown);
                    });

            // Transfer repair requests to Unknown user (preserve history)
            repairRequestRepository.findByReporterId(user.getId()).forEach(request -> {
                request.setReporter(unknownUser);
                repairRequestRepository.save(request);
            });

            // Transfer repair messages to Unknown user (preserve history)
            repairMessageRepository.findBySenderId(user.getId()).forEach(message -> {
                message.setSender(unknownUser);
                repairMessageRepository.save(message);
            });

            // Delete user roles
            userRoleRepository.findByUserId(user.getId()).forEach(role -> userRoleRepository.delete(role));

            // Finally delete the user
            userRepository.delete(user);
        }
    }

    public void assignRoom(Long studentId, Long roomId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        com.dormitory.domain.entity.Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Deactivate active assignments and decrement old room occupancy
        roomAssignmentRepository.findByStudentIdAndIsActiveTrue(studentId)
                .ifPresent(assignment -> {
                    assignment.setIsActive(false);
                    assignment.setEndDate(java.time.LocalDate.now());

                    // Decrement occupancy of the old room (handle null safely)
                    com.dormitory.domain.entity.Room oldRoom = assignment.getRoom();
                    Integer currentOcc = oldRoom.getCurrentOccupancy();
                    if (currentOcc == null) {
                        currentOcc = 0;
                    }
                    if (currentOcc > 0) {
                        oldRoom.setCurrentOccupancy(currentOcc - 1);
                        roomRepository.save(oldRoom);
                    }

                    roomAssignmentRepository.save(assignment);
                });

        // Increment occupancy of the new room (handle null safely)
        Integer newOcc = room.getCurrentOccupancy();
        if (newOcc == null) {
            newOcc = 0;
        }
        room.setCurrentOccupancy(newOcc + 1);
        roomRepository.save(room);

        // Create room assignment
        RoomAssignment assignment = new RoomAssignment();
        assignment.setStudent(student);
        assignment.setRoom(room);
        assignment.setStartDate(java.time.LocalDate.now());
        assignment.setIsActive(true);

        roomAssignmentRepository.save(assignment);

        // Auto-generate monthly rent payments for current year
        generateMonthlyRentForStudent(studentId);
    }

    private void generateMonthlyRentForStudent(Long studentId) {
        int year = java.time.LocalDate.now().getYear();
        Double monthlyAmount = 350.0;

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        String[] monthNames = { "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie" };

        for (int month = 1; month <= 12; month++) {
            String paymentType = "Regie " + monthNames[month - 1] + " " + year;
            boolean exists = paymentRepository.findByStudentId(studentId).stream()
                    .anyMatch(p -> paymentType.equals(p.getPaymentType()));

            if (!exists) {
                Payment payment = new Payment();
                payment.setStudent(student);
                payment.setPaymentType(paymentType);
                payment.setAmount(monthlyAmount);
                payment.setDueDate(java.time.LocalDate.of(year, month, 15));
                payment.setStatus(com.dormitory.domain.enums.PaymentStatus.PENDING);
                paymentRepository.save(payment);
            }
        }
    }

    public void unassignRoom(Long studentId) {
        // Find and deactivate active assignment
        roomAssignmentRepository.findByStudentIdAndIsActiveTrue(studentId)
                .ifPresent(assignment -> {
                    assignment.setIsActive(false);
                    assignment.setEndDate(java.time.LocalDate.now());

                    // Decrement occupancy of the room (handle null safely)
                    com.dormitory.domain.entity.Room room = assignment.getRoom();
                    Integer currentOcc = room.getCurrentOccupancy();
                    if (currentOcc == null) {
                        currentOcc = 0;
                    }
                    if (currentOcc > 0) {
                        room.setCurrentOccupancy(currentOcc - 1);
                        roomRepository.save(room);
                    }

                    roomAssignmentRepository.save(assignment);
                });

        // Delete all rent payments (Regie) for this student
        deleteRentPaymentsForStudent(studentId);
    }

    private void deleteRentPaymentsForStudent(Long studentId) {
        paymentRepository.findByStudentId(studentId).stream()
                .filter(p -> p.getPaymentType() != null && p.getPaymentType().startsWith("Regie "))
                .forEach(payment -> paymentRepository.delete(payment));
    }

    private StudentDTO toDTO(Student student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setEmail(student.getUser().getEmail());
        dto.setFullName(student.getUser().getFullName());
        dto.setPhone(student.getUser().getPhone());
        dto.setCnp(student.getCnp());

        if (student.getFaculty() != null) {
            dto.setFacultyId(student.getFaculty().getId());
            dto.setFacultyName(student.getFaculty().getName());
        }

        dto.setYear(student.getYear());
        dto.setGroupName(student.getGroupName());

        roomAssignmentRepository.findByStudentIdAndIsActiveTrue(student.getId())
                .ifPresent(assignment -> {
                    dto.setRoomId(assignment.getRoom().getId());
                    dto.setRoomNumber(assignment.getRoom().getRoomNumber());
                    if (assignment.getRoom().getDormitory() != null) {
                        dto.setDormitoryName(assignment.getRoom().getDormitory().getName());
                    }
                });

        return dto;
    }
}
