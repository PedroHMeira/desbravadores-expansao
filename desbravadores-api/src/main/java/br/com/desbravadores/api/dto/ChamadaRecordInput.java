package br.com.desbravadores.api.dto;

import br.com.desbravadores.api.model.AttendanceStatus;

// Um item da lista enviada em POST /api/chamada/submit: o status de um aluno no dia.
public class ChamadaRecordInput {
    private Long userId;
    private AttendanceStatus status;
    private String justification;
    private boolean lenco;
    private boolean camisa;
    private boolean calca;
    private boolean tenis;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public boolean isLenco() { return lenco; }
    public void setLenco(boolean lenco) { this.lenco = lenco; }
    public boolean isCamisa() { return camisa; }
    public void setCamisa(boolean camisa) { this.camisa = camisa; }
    public boolean isCalca() { return calca; }
    public void setCalca(boolean calca) { this.calca = calca; }
    public boolean isTenis() { return tenis; }
    public void setTenis(boolean tenis) { this.tenis = tenis; }
}
