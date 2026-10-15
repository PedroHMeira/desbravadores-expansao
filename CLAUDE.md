# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Este repositório é uma **expansão** de um projeto de extensão da Faculdade Senac Joinville para o clube de escoteiros "Desbravadores". O trabalho original foi desenvolvido por Arthur Vieira Bruske e Silas Cassiano Tristoni. Este projeto **não remove funcionalidades existentes** — apenas corrige bugs e adiciona recursos novos.

- **Backend**: Spring Boot (Java 17) em `desbravadores-api/`. **Não migrar para outro framework.**
- **Frontend**: HTML/CSS/JS puro em `desbravadores-frontend/`. **Não migrar para React nem qualquer outro framework/bundler.**

## Comandos comuns

### Backend (`desbravadores-api/`)

```
./mvnw spring-boot:run       # roda a API em http://localhost:8080
./mvnw test                  # roda todos os testes
./mvnw test -Dtest=NomeDaClasse   # roda uma classe de teste específica
./mvnw clean package          # build completo (gera o jar em target/)
```

Pré-requisitos para rodar a API:
- JDK 17 instalado.
- MySQL 8 acessível em `localhost:3306`, usuário `root` sem senha, banco `desbravadores_db` (ver `src/main/resources/application.properties`). O schema é criado/atualizado automaticamente (`spring.jpa.hibernate.ddl-auto=update`).

### Frontend (`desbravadores-frontend/`)

Arquivos estáticos — não há build step. Para desenvolver, sirva a pasta com o Live Server (ou equivalente) na porta 5500 e abra `login.html`. As chamadas à API usam `fetchApi` (`js/apiClient.js`), que espera a API em `http://localhost:8080`.

## Arquitetura

### Backend

Padrão em camadas sob `br.com.desbravadores.api`:
- `controller/` — endpoints REST (um controller por domínio: `AuthController`, `UserController`, `GroupController`, `TaskController`, `ChamadaController`/`AttendanceService`, `BadgeController`, `AchievementController`, `GamificationController`, `NotificationController`, `ProfileController`, `AdminController`, `BackgroundController`).
- `service/` — regras de negócio (`AuthService`, `UserService`, `GroupService`, `AttendanceService`, `BadgeService`, `GamificationService`, `TokenService`, `FileStorageService`, `CustomUserDetailsService`).
- `repository/` — interfaces Spring Data JPA, uma por entidade.
- `model/` — entidades JPA (`User`, `Group`, `Task`, `AttendanceRecord`, `Badge`, `Achievement`, `Notification`, `Background`, `XpLog`, enums `Role`/`RewardType`).
- `dto/` — objetos de transferência usados nas respostas/entradas dos controllers.
- `config/` — `SecurityConfig` (Spring Security + JWT), `JwtAuthFilter` em `filter/`, `WebConfig`/`MvcConfig` (CORS, recursos estáticos de upload), `JacksonConfig`, `DataInitializer` (seed de dados iniciais, incluindo o usuário admin).

Autenticação é via JWT (`io.jsonwebtoken`): login em `POST /auth/login`, token enviado depois em `Authorization: Bearer <token>`, validado pelo `JwtAuthFilter`. Uploads de arquivo usam `FileStorageService` e são servidos a partir do diretório configurado em `file.upload-dir` (`file`/`uploads`).

Ao adicionar uma funcionalidade nova, siga o padrão existente: controller fino delegando para um service, service usando repositories, DTO quando a entidade não deve ser exposta diretamente.

### Frontend

Sem framework — HTML por página (`login.html`, `app.html`, `admin.html`) e JS modular em `js/`:
- `apiClient.js` — `fetchApi(endpoint, options)` centraliza as chamadas HTTP à API (inclui o token JWT salvo).
- `ui/toast.js` — `showToast(message, type, duration)` para feedback visual ao usuário.
- `authGuard.js` — protege páginas que exigem login.
- `views/` — lógica específica de cada tela.
- `components/` — componentes reutilizáveis (ex. `modal.js`).

Toda funcionalidade de UI nova deve reusar `fetchApi` para chamadas à API e `showToast` para mensagens ao usuário, em vez de criar mecanismos paralelos.

## Convenções deste projeto

- Textos de interface (labels, mensagens, toasts) em **português do Brasil**.
- Requisitos funcionais, quando documentados, no formato **"O sistema deverá..."**.
- Cada funcionalidade nova em uma branch `feature/<nome>`, com commits pequenos e mensagens em português.
- O remote `upstream` aponta para o repositório original da equipe (apenas leitura — push bloqueado); `origin` é este repositório expandido.
