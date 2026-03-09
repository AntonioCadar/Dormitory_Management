package com.dormitory.dto;

// removed lombok
// removed lombok
import java.util.List;



public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private List<String> roles;
}
