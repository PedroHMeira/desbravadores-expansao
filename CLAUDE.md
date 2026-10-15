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
- JDK 17 instalado (neste ambiente Windows, foi instalado via `winget install --id EclipseAdoptium.Temurin.17.JDK`; caminho: `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`. Exporte `JAVA_HOME`/`PATH` apontando para lá antes de rodar o `mvnw`, já que o JDK padrão do sistema é a versão 26).
- MySQL 8 acessível em `localhost:3306`, usuário `root` sem senha, banco `desbravadores_db`. Credenciais, chave JWT, admin padrão e CORS agora são configuráveis por variável de ambiente (ver `.env.example` na raiz) — os valores atuais são usados como padrão se nenhuma variável for definida. O schema é criado/atualizado automaticamente (`spring.jpa.hibernate.ddl-auto=update`).
- Alternativa: `docker compose up -d` na raiz do repo sobe MySQL (com volume persistente) + API (via `desbravadores-api/Dockerfile`, multi-stage Maven+JRE 17).

### Frontend (`desbravadores-frontend/`)

Arquivos estáticos — não há build step. Para desenvolver, sirva a pasta com o Live Server (ou equivalente) na porta 5500 e abra `login.html`. As chamadas à API usam `fetchApi` (`js/apiClient.js`), que lê a URL base de `window.API_BASE_URL` (definido em `js/config.js`, carregado antes dos outros scripts em `login.html`/`app.html`/`admin.html` — é o único lugar a editar para apontar para outro ambiente). Para evitar XSS, texto livre vindo de dados do usuário (nomes, descrições, mensagens) deve ser escapado com `escapeHtml()` de `js/utils/sanitize.js` antes de entrar em `innerHTML`.

## Arquitetura

### Backend

Padrão em camadas sob `br.com.desbravadores.api`:
- `controller/` — endpoints REST (um controller por domínio: `AuthController`, `UserController`, `GroupController`, `TaskController`, `ChamadaController`/`AttendanceService`, `BadgeController`, `AchievementController`, `GamificationController`, `NotificationController`, `ProfileController`, `AdminController`, `BackgroundController`).
- `service/` — regras de negócio (`UserService`, `GroupService`, `AttendanceService`, `BadgeService`, `GamificationService`, `TokenService`, `FileStorageService`, `CustomUserDetailsService`).
- `repository/` — interfaces Spring Data JPA, uma por entidade.
- `model/` — entidades JPA (`User`, `Group`, `Task`, `AttendanceRecord`, `Badge`, `Achievement`, `Notification`, `Background`, `XpLog`, enums `Role`/`RewardType`).
- `dto/` — objetos de transferência usados nas respostas/entradas dos controllers.
- `config/` — `SecurityConfig` (Spring Security + JWT), `JwtAuthFilter` em `filter/`, `WebConfig`/`MvcConfig` (CORS, recursos estáticos de upload), `JacksonConfig`, `DataInitializer` (seed de dados iniciais, incluindo o usuário admin).

Autenticação é via JWT (`io.jsonwebtoken`): login em `POST /auth/login`, token enviado depois em `Authorization: Bearer <token>`, validado pelo `JwtAuthFilter` (loga em nível `debug` via slf4j, não em `System.out`). A chave de assinatura (`jwt.secret`) e o tempo de expiração (`jwt.expiration.ms`) são configuráveis por variável de ambiente — a chave é fixa entre reinícios da API (antes era gerada aleatoriamente a cada start, invalidando tokens). `User.password` é `@JsonProperty(WRITE_ONLY)`: nunca aparece em respostas JSON, mas continua aceito ao criar/atualizar um usuário. Uploads de arquivo usam `FileStorageService` e são servidos a partir do diretório configurado em `file.upload-dir` (`file`/`uploads`).

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

## Fluxo de trabalho desta expansão (acordado com o usuário)

Uma funcionalidade por vez, nesta ordem (ver lista completa abaixo). Para cada uma:
1. Criar a branch `feature/<nome>` a partir da `main` atualizada.
2. Mostrar um plano curto (arquivos, mudanças no banco, endpoints, telas) e **esperar aprovação** antes de implementar.
3. Implementar seguindo os padrões do projeto; escrever testes de backend quando fizer sentido.
4. Compilar, rodar os testes, subir a API e conferir os endpoints.
5. Dizer exatamente o que testar no navegador e **parar até o usuário confirmar**.
6. Só depois da confirmação: commit, push, `gh pr create` (descrição com requisitos no formato "O sistema deverá...") e merge na main.
7. Registrar o que foi feito em `docs/EXPANSAO.md` (usado para montar slides depois).

**Lista completa de funcionalidades planejadas, nesta ordem:**
1. `feature/base-producao` — hardening para produção (ver estado abaixo).
2. `feature/chamada-completa` — status Presente/Falta/Falta justificada (com motivo), registro de uniforme (lenço/camisa/calça/tênis), carregar chamada existente do dia em vez de duplicar, Diretor pode fazer chamada de qualquer grupo, UI otimizada para celular com foto grande.
3. `feature/relatorio-frequencia` — relatório para Diretor/Monitor: filtro por período/unidade, % presença e % uniforme completo por desbravador e média da unidade, destaque para 3+ faltas seguidas, exportação PDF e Excel.
4. `feature/responsaveis` — novo perfil RESPONSAVEL vinculado a um ou mais desbravadores (Diretor cadastra/vincula), tela do responsável com frequência/eventos/notificações dos filhos, registro de consentimento LGPD.
5. `feature/checklist-eventos` — checklist de itens ligado a um evento (Task), responsáveis marcam itens separados, Monitor/Diretor vê quem completou.
6. `feature/inscricao-eventos` — responsável confirma participação e autoriza o desbravador no evento; Direção vê confirmados/autorizados.
7. `feature/pwa-notificacoes` — frontend como PWA instalável (manifest + service worker) e notificações push (Web Push) para as notificações já existentes.

## Estado atual (continuar a partir daqui)

**`feature/base-producao`: concluída, mergeada na `main`** (PR #1, merge commit `7a883ed`). Testada manualmente no navegador pelo próprio Claude (Chrome via extensão, a pedido do usuário) com os três perfis (DIRETOR/MONITOR/DESBRAVADOR); detalhes em `docs/EXPANSAO.md`.

Durante esse teste manual foram encontrados e corrigidos 3 bugs **pré-existentes** (não introduzidos nesta expansão, mas bloqueavam uso básico):
- `Group` mapeava para a tabela `groups`, palavra reservada desde MySQL 8.0.2 — toda query na tabela de grupos falhava com erro de sintaxe SQL, e o filtro de segurança traduzia isso em 403, derrubando a sessão de qualquer DIRETOR ao abrir o Dashboard. **Corrigido** citando o identificador: `@Table(name = "\`groups\`")`. **Atenção ao criar novas entidades:** evitar nomes de tabela que sejam palavras reservadas do MySQL 8 (`groups`, `rows`, `rank`, etc. — lista completa na doc do MySQL).
- `/api/backgrounds` e `/api/tasks` retornam `Page<T>` (paginado), mas `perfil.js`, `home.js` e `agenda.js` tratavam a resposta como array direto. **Corrigido** extraindo `.content`. **Atenção ao consumir endpoint paginado no frontend:** sempre extrair `.content` (ver padrão já usado em `dashboard.js`, `grupos.js`, `manage-users.js`).

**Ambiente local (Windows), pode estar assim ao retomar:**
- Container `desbravadores-mysql` rodando via `docker compose` (porta 3306, volume `desbravadores-expansao_mysql-data` persistente).
- API pode estar rodando via `mvnw spring-boot:run` em background (porta 8080) e frontend via `npx serve -l 5500` (porta 5500) — processos de teste desta sessão, ok encerrar se não estiverem mais rodando.
- JDK 17 via winget (caminho no início deste arquivo); sempre exportar `JAVA_HOME`/`PATH` antes de usar `mvnw` fora do Docker.

**Armadilhas descobertas nesta sessão (relevantes para continuar):**
- O shell do Bash tool não mantém estado entre chamadas — `export JAVA_HOME=...` precisa estar na mesma chamada que usa o `mvnw`.
- `./mvnw spring-boot:run` em background: parar a tarefa mata o wrapper, mas o `java.exe` filho continua rodando — localizar e `taskkill //F //PID` manualmente para liberar a porta 8080.
- MySQL 8 recente resolvido pela tag `mysql:8` é a `8.4.x` — **`groups` é palavra reservada nessa versão** (ver bug acima).
- `npx serve` serve o frontend estático sem exigir instalação prévia; o Live Server mencionado no fluxo normal de dev não estava disponível neste ambiente de teste.
- Para testar como MONITOR/DESBRAVADOR é preciso um grupo + usuários de teste (não existem por padrão, só o admin seed) — criados via `POST /api/groups` e `POST /api/admin/users` com o token do DIRETOR, e removidos do banco ao final do teste.
- `gh pr create` sem `--repo`/`--base` explícitos tentou abrir o PR contra o `upstream` (SilasTristoni/DesbravadoresTeste) em vez do `origin` — sempre passar `--repo PedroHMeira/desbravadores-expansao --base main` neste repositório.

**Próximos passos ao retomar:**
1. Começar `feature/chamada-completa`: explorar `ChamadaController`, `AttendanceRecord`, `chamada.js`, propor plano e esperar aprovação antes de implementar.
