package br.com.desbravadores.api.model;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType; // Import necessário
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
@JsonIdentityInfo(
    generator = ObjectIdGenerators.PropertyGenerator.class,
    property = "id")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String surname;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private String avatar;
    private int level;
    private int xp;
    
    @Enumerated(EnumType.STRING)
    private Role role;

    // CORREÇÃO: Voltando para LAZY loading para melhor performance
    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "group_id")
    private Group group;

    // CORREÇÃO: Voltando para LAZY loading (padrão para @ManyToMany)
    @ManyToMany(fetch = FetchType.LAZY) 
    @JoinTable(
        name = "user_badges",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "badge_id")
    )
    private Set<Badge> badges = new HashSet<>();

    // CORREÇÃO: Voltando para LAZY loading
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_unlocked_backgrounds",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "background_id")
    )
    private Set<Background> unlockedBackgrounds = new HashSet<>();

    // CORREÇÃO: Voltando para LAZY loading
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_background_id")
    private Background selectedBackground;

    // Construtores, Getters e Setters permanecem os mesmos...
    public User() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSurname() { return surname; }
    public void setSurname(String surname) { this.surname = surname; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getXp() { return xp; }
    public void setXp(int xp) { this.xp = xp; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public Set<Badge> getBadges() { return badges; }
    public void setBadges(Set<Badge> badges) { this.badges = badges; }
    public Set<Background> getUnlockedBackgrounds() { return unlockedBackgrounds; }
    public void setUnlockedBackgrounds(Set<Background> unlockedBackgrounds) { this.unlockedBackgrounds = unlockedBackgrounds; }
    public Background getSelectedBackground() { return selectedBackground; }
    public void setSelectedBackground(Background selectedBackground) { this.selectedBackground = selectedBackground; }
}