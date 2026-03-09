package com.dormitory.repository;

import com.dormitory.domain.entity.Dormitory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DormitoryRepository extends JpaRepository<Dormitory, Long> {
}
