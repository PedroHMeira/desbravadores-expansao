package br.com.desbravadores.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.desbravadores.api.model.Role;
import br.com.desbravadores.api.model.User;
import br.com.desbravadores.api.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.default.email}")
    private String adminEmail;

    @Value("${admin.default.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Verifica se o utilizador administrador já existe no banco de dados
        if (userRepository.findByEmail(adminEmail).isEmpty()) {

            log.info("Criando utilizador administrador padrão ({})", adminEmail);

            User adminUser = new User();
            adminUser.setName("Admin");
            adminUser.setSurname("do Sistema");
            adminUser.setEmail(adminEmail);
            // Codifica a senha padrão antes de salvar
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
            adminUser.setRole(Role.DIRETOR);
            adminUser.setAvatar("img/escoteiro.png");
            adminUser.setLevel(99);
            adminUser.setXp(0);
            adminUser.setGroup(null); // O admin não pertence a um grupo

            userRepository.save(adminUser);

            log.info("Utilizador administrador criado com sucesso.");
        }
    }
}