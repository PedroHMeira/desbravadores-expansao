package br.com.desbravadores.api.dto;

import java.time.LocalDate;
import java.util.List;

// Corpo de POST /api/chamada/submit.
// groupId só é usado quando quem chama é DIRETOR (MONITOR usa sempre o próprio grupo).
public class ChamadaSubmitRequest {
    private LocalDate date;
    private Long groupId;
    private List<ChamadaRecordInput> records;

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    public List<ChamadaRecordInput> getRecords() { return records; }
    public void setRecords(List<ChamadaRecordInput> records) { this.records = records; }
}
