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

## feature/chamada-completa

**Objetivo:** tornar a chamada utilizável de verdade em campo — hoje só registrava presença binária (sem Falta/Falta Justificada), não registrava uniforme, duplicava registros ao refazer a chamada do mesmo dia, e o Diretor não conseguia fazer a chamada de nenhum grupo.

**Requisitos atendidos:**
- O sistema deverá permitir marcar cada desbravador como Presente, Falta ou Falta Justificada (com motivo obrigatório neste último caso) ao fazer a chamada.
- O sistema deverá registrar o uniforme (lenço, camisa, calça, tênis) de cada desbravador presente; o uniforme não se aplica quando o status não é Presente.
- O sistema deverá carregar a chamada já registrada para a data/grupo selecionado, permitindo editá-la, em vez de criar registros duplicados a cada novo envio.
- O sistema deverá permitir que o Diretor faça ou edite a chamada de qualquer grupo, selecionando o grupo antes de começar.
- O sistema deverá impedir que um Monitor registre ou edite a chamada de um grupo que não é o seu, e que registre chamada para uma data futura; Monitores só podem editar os últimos 7 dias, Diretores podem editar qualquer data passada.
- O sistema deverá exigir um status para todos os desbravadores do grupo antes de permitir o envio da chamada, mostrando quantos já foram marcados e oferecendo um atalho para marcar todos como presentes.
- A UI da chamada deverá ser otimizada para uso em celular, com foto grande de cada desbravador e botões de toque confortáveis.

**O que mudou:**
- Backend: novo enum `AttendanceStatus` (PRESENTE/FALTA/FALTA_JUSTIFICADA); `AttendanceRecord` ganhou `status`, `justification` e os 4 campos de uniforme, mais uma unique constraint `(user_id, date)` que viabiliza o upsert (registros antigos recebem `status=PRESENTE` e uniforme `false` via `DEFAULT` na própria coluna, sem precisar de migração em Java). Novo `data.sql` (com `spring.sql.init.mode=always`) remove duplicados de `(user_id, date)` antes do Hibernate tentar criar essa constraint — necessário porque, sem Flyway/Liquibase neste projeto, essa é a única janela para rodar uma limpeza antes do `ddl-auto=update`. `ChamadaController` reescrito: `GET /api/chamada/members` e `GET /api/chamada/day` (novo, carrega o estado salvo do dia) aceitam `groupId` opcional; `POST /api/chamada/submit` passa a fazer upsert por `(user, data)`, exige um status para cada membro do grupo, valida o motivo quando Justificada e força o uniforme para `false` quando o status não é Presente (defesa também no servidor, não só no frontend). Resolução de grupo e validação de data centralizadas em `AttendanceService` (MONITOR só acessa o próprio grupo — tentar outro retorna 403; DIRETOR precisa informar `groupId` nesses dois endpoints).
- Frontend: `admin-main.js` parou de esconder o botão "Chamada" para o DIRETOR. `chamada.js` reescrito: seletor de grupo quando DIRETOR, contador "X de Y marcados", botão "Marcar todos presentes", cada desbravador com 3 botões de status (Presente/Falta/Justificada — motivo obrigatório aparece só na última), checklist de uniforme habilitado só quando Presente, e carregamento automático do que já foi salvo para a data/grupo ao abrir ou trocar a data. `chamada.css` ganhou os estados visuais dos 3 status e layout mobile-first (foto maior, botões com alvo de toque ≥44px). `dashboard.js` (relatório simples por dia) e `perfil.js` (histórico de chamadas do próprio desbravador) atualizados para mostrar os 3 status e o uniforme.

**Testes:** suite de backend (`UserJsonSerializationTest` + contexto Spring) continua passando; migração validada rodando contra o MySQL de desenvolvimento (colunas novas, `DEFAULT 'PRESENTE'`/`DEFAULT 0` aplicado a uma linha inserida sem esses campos, unique constraint criada com sucesso).

**Verificação manual:** fluxo completo testado no navegador com grupo/monitor/desbravadores de teste (removidos ao final) — MONITOR marca Presente+uniforme e Falta Justificada+motivo, submete, reabre a tela e vê o estado salvo (sem duplicar no banco), edita e confirma que atualiza o mesmo registro; DIRETOR vê o botão Chamada, escolhe o grupo no seletor e vê o mesmo estado salvo pelo monitor; relatório do Dashboard e histórico do Perfil exibem os 3 status e o uniforme corretamente. Validações de borda confirmadas via API: MONITOR com `groupId` de outro grupo → 403; DIRETOR sem `groupId` → 400; data futura → 400; MONITOR com data >7 dias atrás → 400; payload faltando um aluno → 400; Falta Justificada sem motivo → 400; uniforme enviado como `true` com status Falta é gravado como `false` (reforço no servidor).

**Bugs pré-existentes corrigidos durante o teste manual desta feature:**
- No filtro de grupo do "Relatório de Presença" (Dashboard, visão do Diretor), o listener de `change` chamava `renderDashboardData`, que reconstruía o próprio widget do relatório (incluindo o `<select>`) a cada seleção — o dropdown voltava sozinho para "Todos os Desbravadores" antes do Diretor conseguir clicar em "Gerar Relatório", e o filtro da lista de usuários por grupo nunca chegava a aplicar de fato. Corrigido para chamar só `renderUserList` nesse listener, sem reconstruir o widget inteiro.
- Datas de chamada (`new Date('YYYY-MM-DD')`) exibiam o dia anterior ao real quando o fuso do navegador está atrás de UTC (ex.: 15/10 aparecia como "14 de outubro"), em `perfil.js` (histórico de chamadas) e `dashboard.js` (título do relatório). Corrigido anexando `'T00:00:00'` antes de criar o `Date`, mesmo padrão já usado em `home.js` para o mesmo problema.
