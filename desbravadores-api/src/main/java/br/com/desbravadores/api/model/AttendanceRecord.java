package br.com.desbravadores.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "attendance_records", uniqueConstraints = @UniqueConstraint(name = "uk_attendance_user_date", columnNames = { "user_id", "date" }))
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // O aluno a que este registo se refere
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // O grupo ao qual o aluno pertencia no momento da chamada
    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    // A data em que a chamada foi registada
    @JoinColumn(nullable = false)
    private LocalDate date;

    // Quem registou/editou a chamada (Monitor ou Diretor)
    @ManyToOne
    @JoinColumn(name = "recorded_by_id", nullable = false)
    private User recordedBy;

    // Registos anteriores à introdução deste campo assumem PRESENTE (DEFAULT na coluna cobre o backfill)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30) NOT NULL DEFAULT 'PRESENTE'")
    private AttendanceStatus status = AttendanceStatus.PRESENTE;

    // Motivo da falta, obrigatório apenas quando status = FALTA_JUSTIFICADA
    @Column(length = 500)
    private String justification;

    // Uniforme só é relevante quando status = PRESENTE; nos demais casos fica false
    @Column(nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean lenco;

    @Column(nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean camisa;

    @Column(nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean calca;

    @Column(nullable = false, columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean tenis;

    // Construtor vazio
    public AttendanceRecord() {
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }
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
