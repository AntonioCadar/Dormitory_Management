package com.dormitory.controller;

import com.dormitory.dto.StudentDTO;
import com.dormitory.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents(
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role) && !"CASIERIE".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(studentService.getAllStudents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        StudentDTO student = studentService.getStudentById(id);

        if ("STUDENT".equals(role)) {
            StudentDTO ownProfile = studentService.getStudentByUserId(userId);
            if (!student.getId().equals(ownProfile.getId())) {
                return ResponseEntity.status(403).build();
            }
        }

        return ResponseEntity.ok(student);
    }

    @GetMapping("/me")
    public ResponseEntity<StudentDTO> getMyProfile(
            @RequestHeader(value = "X-User-Id") Long userId) {
        return ResponseEntity.ok(studentService.getStudentByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<StudentDTO> createStudent(
            @RequestBody StudentDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(studentService.createStudent(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentDTO> updateStudent(
            @PathVariable Long id,
            @RequestBody StudentDTO dto,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(studentService.updateStudent(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        studentService.deleteStudent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/assign-room/{roomId}")
    public ResponseEntity<Void> assignRoom(
            @PathVariable Long id,
            @PathVariable Long roomId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        studentService.assignRoom(id, roomId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/unassign-room")
    public ResponseEntity<Void> unassignRoom(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {

        if (!"ADMINISTRATOR".equals(role)) {
            return ResponseEntity.status(403).build();
        }

        studentService.unassignRoom(id);
        return ResponseEntity.ok().build();
    }
}
