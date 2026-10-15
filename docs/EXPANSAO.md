# Expansão do Sistema Desbravadores — Registro de Funcionalidades

Este documento registra, por funcionalidade, o que foi feito nesta expansão do projeto original da equipe Arthur Vieira Bruske e Silas Cassiano Tristoni (Faculdade Senac Joinville).

## feature/base-producao

**Objetivo:** preparar o sistema para rodar fora do `localhost`, sem alterar o comportamento existente.

**Requisitos atendidos:**
- O sistema deverá nunca expor o hash da senha de um usuário em respostas da API.
- O sistema deverá usar uma chave de assinatura JWT fixa e configurável por variável de ambiente, para que tokens emitidos continuem válidos após reinícios da API.
- O sistema deverá permitir configurar o tempo de expiração do token JWT por variável de ambiente (padrão: 8 horas).
- O sistema deverá permitir configurar o email e a senha do administrador padrão por variável de ambiente.
- O sistema deverá permitir configurar as origens de CORS permitidas por variável de ambiente.
- O sistema deverá permitir configurar a URL da API usada pelo frontend em um único ponto.
- O sistema deverá permitir configurar as credenciais de acesso ao banco de dados por variável de ambiente.
- O sistema deverá escapar dados de usuário (nomes, descrições, mensagens) antes de inseri-los via `innerHTML`, para evitar XSS.
- O sistema deverá registrar eventos de autenticação em log estruturado, em vez de `System.out.println`.

**O que mudou:**
- Backend: `password` do `User` marcado como `WRITE_ONLY` (nunca serializado); `TokenService` usa chave JWT fixa vinda de `jwt.secret`; `JwtAuthFilter` usa `Logger` (slf4j) em vez de `System.out`; `DataInitializer` e `WebConfig` configuráveis por variável de ambiente; `application.properties` com todos os valores sensíveis parametrizados (mantendo os valores atuais como padrão de desenvolvimento); removido `AuthService.java` (código morto que logava senha em texto puro).
- Frontend: criado `js/config.js` como ponto único da URL da API; `apiClient.js`, `login.js` e as telas que montavam URLs de imagem (`create-item.js`, `manage-achievements.js`, `conquistas.js`, `perfil.js`) passaram a usar essa configuração; criado `js/utils/sanitize.js` com `escapeHtml()`, aplicado nos campos de texto livre (nomes de usuário/grupo/tarefa/conquista/fundo, mensagens de notificação) em `chamada.js`, `dashboard.js`, `manage-users.js`, `manage-groups.js`, `grupos.js`, `perfil.js`, `notifications.js`, `create-item.js`, `manage-achievements.js` e `manage-tasks.js`; removido texto solto de comentário que aparecia na tela em `chamada.js`, `home.js` e `perfil.js`.
- Infraestrutura: `desbravadores-api/Dockerfile` (build multi-stage); `docker-compose.yml` com serviços `mysql` e `api`, volumes persistentes para o banco e para os uploads; `.env.example` com todas as variáveis configuráveis.

**Testes:** novo `UserJsonSerializationTest` garante que `password` nunca aparece ao serializar um `User`.

**Verificação manual:** login com `adm@gmail.com`/`adm123` funcionando; token emitido antes de um restart da API continuou válido após o restart; `GET /api/users/{id}` confirmado sem o campo `password`; stack completa validada via `docker compose up` (build da imagem da API, MySQL com healthcheck, login funcionando dentro do container).

**Bugs pré-existentes encontrados e corrigidos durante o teste manual desta feature** (não introduzidos nesta expansão, mas bloqueavam o uso básico do sistema):
- `Group` mapeava para a tabela `groups`, que é palavra reservada a partir do MySQL 8.0.2 (window functions). Toda query na tabela de grupos falhava com erro de sintaxe SQL, o que o `JwtAuthFilter`/Spring Security traduzia em 403 — deslogando qualquer usuário DIRETOR assim que o Dashboard tentava carregar a lista de grupos. Corrigido citando o identificador: `@Table(name = "\`groups\`")`.
- `/api/backgrounds` e `/api/tasks` retornam `Page<T>` (paginado), mas `perfil.js` (aba "Fundos de Perfil"), `home.js` (lembretes do mês e contagem de tarefas) e `agenda.js` (calendário) tratavam a resposta como array direto, causando `TypeError` e essas telas não carregarem para nenhum usuário. Corrigido extraindo `.content` (e `.totalElements` onde só a contagem era necessária), seguindo o mesmo padrão já usado em `dashboard.js`, `grupos.js` e `manage-users.js` para os mesmos endpoints.
