package br.com.desbravadores.api.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import br.com.desbravadores.api.dto.AttendanceHistoryDTO;
import br.com.desbravadores.api.model.AttendanceRecord;
import br.com.desbravadores.api.model.Group;
import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.AttendanceRecordRepository;
import br.com.desbravadores.api.repository.GroupRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private GroupRepository groupRepository;

    /**
     * NOVO MÉTODO: Retorna o histórico de presenças do usuário.
     * @param user O usuário logado.
     * @return Lista de AttendanceHistoryDTO.
     */
    public List<AttendanceHistoryDTO> getUserAttendanceHistory(User user) {
        List<AttendanceRecord> records = attendanceRecordRepository.findByUserIdOrderByDateDesc(user.getId());

        return records.stream()
            .map(record -> new AttendanceHistoryDTO(
                record.getDate(),
                record.getStatus(),
                record.getJustification(),
                record.getGroup() != null ? record.getGroup().getName() : "Sem Grupo",
                record.isLenco(),
                record.isCamisa(),
                record.isCalca(),
                record.isTenis()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Resolve de qual grupo a chamada deve ser feita/consultada.
     * DIRETOR: pode escolher qualquer grupo; se requireGroupIdForDirector for true, groupId é obrigatório.
     * MONITOR: só pode usar o próprio grupo — se pedir outro, é AccessDeniedException (403).
     * Retorna null quando o usuário (DIRETOR sem groupId e sem grupo próprio, ou MONITOR) não tem grupo associado.
     */
    public Group resolveTargetGroup(User currentUser, Long requestedGroupId, boolean requireGroupIdForDirector) {
        boolean isDirector = currentUser.getRole() == Role.DIRETOR;

        if (isDirector) {
            if (requestedGroupId == null) {
                if (requireGroupIdForDirector) {
                    throw new IllegalArgumentException("Selecione um grupo para fazer a chamada.");
                }
                return currentUser.getGroup();
            }
            return groupRepository.findById(requestedGroupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo não encontrado."));
        }

        Group ownGroup = currentUser.getGroup();
        if (requestedGroupId != null && (ownGroup == null || !requestedGroupId.equals(ownGroup.getId()))) {
            throw new AccessDeniedException("Você só pode fazer a chamada do seu próprio grupo.");
        }
        return ownGroup;
    }

    /**
     * MONITOR só pode registar/editar chamada de hoje até 7 dias atrás; DIRETOR, qualquer data passada.
     * Datas futuras são sempre bloqueadas.
     */
    public void validateChamadaDate(LocalDate date, boolean isDirector) {
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) {
            throw new IllegalArgumentException("Não é possível registar chamada para uma data futura.");
        }
        if (!isDirector && date.isBefore(today.minusDays(7))) {
            throw new IllegalArgumentException("Monitores só podem registar ou editar a chamada dos últimos 7 dias.");
        }
    }
}
