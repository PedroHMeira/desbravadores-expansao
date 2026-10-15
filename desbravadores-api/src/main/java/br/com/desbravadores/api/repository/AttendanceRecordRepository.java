package br.com.desbravadores.api.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository; // IMPORT ADICIONADO

import br.com.desbravadores.api.model.AttendanceRecord;      // IMPORT ADICIONADO

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    // ---- NOVO MÉTODO ADICIONADO AQUI ----
    // Procura todos os registos de presença para um grupo específico numa data específica.
    List<AttendanceRecord> findByGroupIdAndDate(Long groupId, LocalDate date);

    // NOVO MÉTODO: Procura todos os registos de presença para um usuário específico.
    List<AttendanceRecord> findByUserIdOrderByDateDesc(Long userId);

    // Usado para upsert: existe registo deste aluno nesta data? Se sim, atualiza em vez de duplicar.
    Optional<AttendanceRecord> findByUserIdAndDate(Long userId, LocalDate date);
}