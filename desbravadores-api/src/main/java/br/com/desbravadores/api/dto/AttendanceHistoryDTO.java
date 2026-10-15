package br.com.desbravadores.api.dto;

import java.time.LocalDate;

import br.com.desbravadores.api.model.AttendanceStatus;

public class AttendanceHistoryDTO {
    private LocalDate date;
    private AttendanceStatus status;
    private String justification;
    private String groupName;
    private boolean lenco;
    private boolean camisa;
    private boolean calca;
    private boolean tenis;

    public AttendanceHistoryDTO(LocalDate date, AttendanceStatus status, String justification, String groupName,
            boolean lenco, boolean camisa, boolean calca, boolean tenis) {
        this.date = date;
        this.status = status;
        this.justification = justification;
        this.groupName = groupName;
        this.lenco = lenco;
        this.camisa = camisa;
        this.calca = calca;
        this.tenis = tenis;
    }

    // Getters e Setters
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public boolean isLenco() { return lenco; }
    public void setLenco(boolean lenco) { this.lenco = lenco; }
    public boolean isCamisa() { return camisa; }
    public void setCamisa(boolean camisa) { this.camisa = camisa; }
    public boolean isCalca() { return calca; }
    public void setCalca(boolean calca) { this.calca = calca; }
    public boolean isTenis() { return tenis; }
    public void setTenis(boolean tenis) { this.tenis = tenis; }
}
