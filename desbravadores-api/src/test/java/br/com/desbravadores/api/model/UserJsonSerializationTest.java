package br.com.desbravadores.api.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

class UserJsonSerializationTest {

    @Test
    void passwordNeverAppearsWhenUserIsSerializedToJson() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setName("Admin");
        user.setSurname("do Sistema");
        user.setEmail("adm@gmail.com");
        user.setPassword("hash-bcrypt-super-secreto");
        user.setRole(Role.DIRETOR);

        String json = new ObjectMapper().writeValueAsString(user);

        assertThat(json).doesNotContain("password");
        assertThat(json).doesNotContain("hash-bcrypt-super-secreto");
    }

    @Test
    void passwordCanStillBeDeserializedFromJson() throws Exception {
        String json = "{\"name\":\"Admin\",\"email\":\"adm@gmail.com\",\"password\":\"senha-recebida\"}";

        User user = new ObjectMapper().readValue(json, User.class);

        assertThat(user.getPassword()).isEqualTo("senha-recebida");
    }
}
