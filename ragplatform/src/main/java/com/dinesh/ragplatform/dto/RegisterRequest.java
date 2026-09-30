package com.dinesh.ragplatform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Username isRequired")
    @Size(min = 3,max = 50,message = "Username must be 3-50 characters")
    private String username;

    @NotBlank(message = "email  is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6,message = "Password must be atleast 6 characters")
    private String password;
}
