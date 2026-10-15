package br.com.desbravadores.api.model;

// ---- NOVOS IMPORTS ADICIONADOS ----
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "`groups`")
// ---- NOVA ANOTAÇÃO ADICIONADA AQUI ----
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToOne
    @JoinColumn(name = "leader_id", referencedColumnName = "id")
    private User leader;

    // Construtor e todos os Getters/Setters continuam os mesmos...
    public Group() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public User getLeader() { return leader; }
    public void setLeader(User leader) { this.leader = leader; }
}