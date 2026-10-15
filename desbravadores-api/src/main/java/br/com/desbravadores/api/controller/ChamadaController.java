package br.com.desbravadores.api.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.desbravadores.api.dto.AttendanceHistoryDTO;
import br.com.desbravadores.api.dto.ChamadaDayRecordDTO;
import br.com.desbravadores.api.dto.ChamadaRecordInput;
import br.com.desbravadores.api.dto.ChamadaSubmitRequest;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.AttendanceStatus;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;
import br.com.desbravadores.api.repository.UserRepository;
import br.com.desbravadores.api.service.AttendanceService;

@RestController
@RequestMapping("/api/chamada")
public class ChamadaController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/members")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> getGroupMembers(
            @RequestParam(value = "groupId", required = false) Long groupId,
            Authentication authentication) {

        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Group targetGroup;
        try {
            targetGroup = attendanceService.resolveTargetGroup(currentUser, groupId, true);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        if (targetGroup == null) {
            return ResponseEntity.ok(List.of());
        }

        List<User> members = userRepository.findByGroupIdAndRole(targetGroup.getId(), Role.DESBRAVADOR);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/day")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> getChamadaDay(
            @RequestParam("date") String dateString,
            @RequestParam(value = "groupId", required = false) Long groupId,
            Authentication authentication) {

        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Group targetGroup;
        try {
            targetGroup = attendanceService.resolveTargetGroup(currentUser, groupId, true);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        if (targetGroup == null) {
            return ResponseEntity.ok(List.of());
        }

        LocalDate date = LocalDate.parse(dateString);
        List<ChamadaDayRecordDTO> existing = attendanceRepository.findByGroupIdAndDate(targetGroup.getId(), date)
            .stream()
            .map(ChamadaDayRecordDTO::new)
            .collect(Collectors.toList());

        return ResponseEntity.ok(existing);
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    @Transactional
    public ResponseEntity<?> submitChamada(@RequestBody ChamadaSubmitRequest payload, Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        boolean isDirector = currentUser.getRole() == Role.DIRETOR;

        Group targetGroup;
        try {
            targetGroup = attendanceService.resolveTargetGroup(currentUser, payload.getGroupId(), true);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
        if (targetGroup == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Você não está associado a nenhum grupo."));
        }

        if (payload.getDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Erro: data da chamada é obrigatória."));
        }
        try {
            attendanceService.validateChamadaDate(payload.getDate(), isDirector);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        List<ChamadaRecordInput> inputRecords = payload.getRecords() != null ? payload.getRecords() : List.of();

        List<User> roster = userRepository.findByGroupIdAndRole(targetGroup.getId(), Role.DESBRAVADOR);
        Set<Long> rosterIds = roster.stream().map(User::getId).collect(Collectors.toSet());
        Set<Long> payloadIds = inputRecords.stream().map(ChamadaRecordInput::getUserId).collect(Collectors.toSet());

        if (!rosterIds.equals(payloadIds)) {
            return ResponseEntity.badRequest().body(Map.of("message",
                "Todos os desbravadores do grupo precisam ter um status antes de submeter a chamada."));
        }

        Map<Long, User> usersById = roster.stream().collect(Collectors.toMap(User::getId, u -> u));
        LocalDate date = payload.getDate();

        for (ChamadaRecordInput input : inputRecords) {
            if (input.getStatus() == null) {
                return ResponseEntity.badRequest().body(Map.of("message",
                    "Erro: status é obrigatório para todos os desbravadores."));
            }
            if (input.getStatus() == AttendanceStatus.FALTA_JUSTIFICADA
                    && (input.getJustification() == null || input.getJustification().isBlank())) {
                return ResponseEntity.badRequest().body(Map.of("message",
                    "Erro: motivo é obrigatório quando o status é Falta Justificada."));
            }

            AttendanceRecord record = attendanceRepository.findByUserIdAndDate(input.getUserId(), date)
                .orElseGet(AttendanceRecord::new);

            record.setUser(usersById.get(input.getUserId()));
            record.setGroup(targetGroup);
            record.setDate(date);
            record.setRecordedBy(currentUser);
            record.setStatus(input.getStatus());

            if (input.getStatus() == AttendanceStatus.PRESENTE) {
                record.setJustification(null);
                record.setLenco(input.isLenco());
                record.setCamisa(input.isCamisa());
                record.setCalca(input.isCalca());
                record.setTenis(input.isTenis());
            } else {
                // Uniforme só faz sentido quando o aluno esteve presente.
                record.setJustification(input.getStatus() == AttendanceStatus.FALTA_JUSTIFICADA
                    ? input.getJustification() : null);
                record.setLenco(false);
                record.setCamisa(false);
                record.setCalca(false);
                record.setTenis(false);
            }

            attendanceRepository.save(record);
        }

        return ResponseEntity.ok(Map.of("message", "Chamada para o dia " + date + " registada com sucesso!"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('DESBRAVADOR')")
    public ResponseEntity<List<AttendanceHistoryDTO>> getMyAttendanceHistory(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<AttendanceHistoryDTO> history = attendanceService.getUserAttendanceHistory(currentUser);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyAuthority('MONITOR', 'DIRETOR')")
    public ResponseEntity<?> getAttendanceReport(
        @RequestParam("date") String dateString,
        @RequestParam(value = "groupId", required = false) Long groupId,
        Authentication authentication) {

        LocalDate date = LocalDate.parse(dateString);
        User currentUser = userRepository.findByEmail(authentication.getName()).orElseThrow();

        Group targetGroup;
        try {
            targetGroup = attendanceService.resolveTargetGroup(currentUser, groupId, false);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        if (targetGroup == null) {
            return ResponseEntity.ok(List.of());
        }

        List<User> allMembers = userRepository.findByGroupIdAndRole(targetGroup.getId(), Role.DESBRAVADOR);
        List<AttendanceRecord> records = attendanceRepository.findByGroupIdAndDate(targetGroup.getId(), date);
        Map<Long, AttendanceRecord> recordsByUserId = records.stream()
            .collect(Collectors.toMap(r -> r.getUser().getId(), r -> r));

        List<Map<String, Object>> report = allMembers.stream().map(member -> {
            AttendanceRecord record = recordsByUserId.get(member.getId());
            Map<String, Object> reportItem = new HashMap<>();
            reportItem.put("id", member.getId());
            reportItem.put("name", member.getName() + " " + member.getSurname());
            // Sem registo para a data = chamada ainda não foi feita nesse dia; mantém o rótulo antigo.
            reportItem.put("status", record != null ? record.getStatus().name() : "AUSENTE");
            reportItem.put("justification", record != null ? record.getJustification() : null);
            reportItem.put("lenco", record != null && record.isLenco());
            reportItem.put("camisa", record != null && record.isCamisa());
            reportItem.put("calca", record != null && record.isCalca());
            reportItem.put("tenis", record != null && record.isTenis());
            return reportItem;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(report);
    }
}
