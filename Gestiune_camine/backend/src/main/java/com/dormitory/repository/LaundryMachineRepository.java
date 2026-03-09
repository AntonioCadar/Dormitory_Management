package com.dormitory.repository;

import com.dormitory.domain.entity.LaundryMachine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LaundryMachineRepository extends JpaRepository<LaundryMachine, Long> {
    List<LaundryMachine> findByDormitoryId(Long dormitoryId);

    List<LaundryMachine> findByIsActiveTrue();
}
