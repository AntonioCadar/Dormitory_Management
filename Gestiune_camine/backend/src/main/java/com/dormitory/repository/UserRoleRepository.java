package com.dormitory.repository;

import com.dormitory.domain.entity.User;
import com.dormitory.domain.entity.UserRole;
import com.dormitory.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUser(User user);

    List<UserRole> findByUserId(Long userId);

    boolean existsByUserAndRole(User user, Role role);
}
