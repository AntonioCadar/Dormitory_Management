package com.dormitory.controller;

import com.dormitory.domain.entity.User;
import com.dormitory.domain.entity.UserRole;
import com.dormitory.repository.UserRepository;
import com.dormitory.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class SimpleController {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public SimpleController(UserRepository userRepository, UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @PostMapping("/api/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getPassword().equals(password)) {
            List<UserRole> userRoles = userRoleRepository.findByUser(user);
            List<String> roles = userRoles.stream()
                    .map(role -> role.getRole().name())
                    .collect(Collectors.toList());

            response.put("success", true);
            response.put("token", "simple-token-" + user.getId());
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("roles", roles);
        } else {
            response.put("success", false);
            response.put("message", "Email sau parolă incorectă");
        }

        return response;
    }

    @GetMapping("/api/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend funcționează!");
        return response;
    }

    @PostMapping("/api/auth/change-password")
    public Map<String, Object> changePassword(
            @RequestHeader(value = "X-User-Id") Long userId,
            @RequestBody Map<String, String> request) {

        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            response.put("success", false);
            response.put("message", "Utilizator negăsit");
            return response;
        }

        if (!user.getPassword().equals(oldPassword)) {
            response.put("success", false);
            response.put("message", "Parola veche este incorectă");
            return response;
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Parola a fost schimbată cu succes");
        return response;
    }
}
