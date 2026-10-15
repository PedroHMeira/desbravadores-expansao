package br.com.desbravadores.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Origens permitidas pelo CORS, configuráveis via 'cors.allowed-origins'
    // (separadas por vírgula). Padrão = ambiente de desenvolvimento local.
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica a configuração a todos os endpoints da API
                .allowedOrigins(allowedOrigins.split(","))
                // Define quais métodos HTTP são permitidos
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // Permite que todos os cabeçalhos sejam enviados na requisição
                .allowedHeaders("*")
                // Permite o envio de credenciais (como cookies ou tokens de autenticação)
                .allowCredentials(true);
    }
}