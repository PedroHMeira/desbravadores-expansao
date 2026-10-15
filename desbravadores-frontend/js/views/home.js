// js/views/home.js

// Importa showToast se ainda não estiver global
import { showToast as toastFunc } from '../ui/toast.js'; // Ajuste o caminho se necessário
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

function renderReminders(viewElement) {
    // Busca e renderiza os lembretes do mês atual
    // Reutiliza a lógica de busca da agenda para a Home
    const remindersContainer = viewElement.querySelector('#reminders-container');
    if (!remindersContainer) return;

    // Pega o mês e ano atuais (API espera 1-12 para o mês)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Mês 1-12

    // Função interna para obter o nome do mês para exibição
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthDisplay = monthNames[currentMonth - 1];

    remindersContainer.innerHTML = '<p>A carregar lembretes...</p>';

    fetchApi(`/api/tasks?year=${currentYear}&month=${currentMonth}&size=999`)
        .then(taskPage => {
            const tasks = taskPage.content;
            if (!tasks || tasks.length === 0) {
                remindersContainer.innerHTML = `<p>Nenhum evento principal agendado para ${monthDisplay}.</p>`;
                return;
            }

            // Ordena os eventos por dia
            tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

            let remindersHTML = tasks.map(task => {
                // task.date é 'YYYY-MM-DD'
                const day = new Date(task.date + 'T00:00:00').getDate(); // Adiciona T00:00:00 para evitar problemas de fuso horário

                return `
                    <div class="reminder-card">
                        <div class="reminder-date">${day} de ${monthDisplay}</div>
                        <div class="reminder-title">${task.title}</div>
                    </div>
                `;
            }).join('');

            remindersContainer.innerHTML = remindersHTML;
        })
        .catch(error => {
            console.error("Erro ao carregar lembretes:", error);
            remindersContainer.innerHTML = '<p style="color: red;">Falha ao carregar lembretes.</p>';
        });
}

async function renderScoutOfTheMonth(viewElement) { // Marcar como async
    const container = viewElement.querySelector('#scout-of-the-month-container');
    if (!container) return;

    container.innerHTML = `
        <div class="scout-of-the-month-widget" style="cursor: pointer;">
            <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
            <p>A carregar...</p>
        </div>
    `;

    try {
        // Chama o novo endpoint da API
        const scout = await fetchApi('/api/gamification/scout-of-the-month');

        if (!scout) {
            container.innerHTML = `
                <div class="scout-of-the-month-widget" style="cursor: default;">
                    <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                    <p>Nenhum desbravador elegível encontrado.</p>
                </div>
            `;
            return;
        }

        // Renderiza as informações do desbravador encontrado
        container.innerHTML = `
            <div class="scout-of-the-month-widget" data-user-id="${scout.userId}" title="Clique para ver o perfil">
                <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                <img src="${scout.avatar || 'img/escoteiro1.png'}" alt="Avatar" class="sotm-avatar">
                <div class="sotm-name">${scout.name} ${scout.surname}</div>
                <div class="sotm-level">Nível ${scout.level}</div>
                <div class="sotm-reason">Com ${scout.badgeCount} conquista(s)!</div>
            </div>
        `;

        // Adiciona listener para navegar para o perfil ao clicar
        const widget = container.querySelector('.scout-of-the-month-widget');
        widget.addEventListener('click', () => {
            const userId = widget.dataset.userId;
            if (userId) {
                const navigateEvent = new CustomEvent('navigate', {
                    detail: { view: 'perfil', data: userId }
                });
                window.dispatchEvent(navigateEvent);
            }
        });

    } catch (error) {
        console.error("Erro ao buscar Desbravador do Mês:", error);
        // Verifica se o erro é 204 No Content antes de mostrar a mensagem de erro
        if (error.message.includes('No Content') || error.message.includes('204')) {
             container.innerHTML = `
                <div class="scout-of-the-month-widget" style="cursor: default;">
                    <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                    <p>Nenhum desbravador elegível encontrado.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="scout-of-the-month-widget" style="cursor: default;">
                    <h3 class="stats-title"><span class="sotm-star">⭐</span> Desbravador do Mês</h3>
                    <p style="color: red;">Não foi possível carregar.</p>
                </div>
            `;
        }
    }
}


export function renderHomeView(viewElement) {
    viewElement.innerHTML = `
        <div class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">Explore a Natureza</h1>
                <p class="hero-subtitle">Descubra experiências incríveis, organize suas atividades e conquiste emblemas.</p>
            </div>
        </div>
        <div class="home-grid">
            <div class="main-content">
                <div class="reminders-section">
                    <h2 class="section-title">Lembretes do Mês</h2>
                    <div class="reminders-grid" id="reminders-container"></div>
                </div>
                <div class="categories-section">
                    <h2 class="section-title">Categorias de Aventura</h2>
                    <div class="category-card" style="--category-color: #ff6b35;" data-category-title="Aventuras Radicais">
                        <span class="category-icon">⚜️</span>
                        <div>
                            <h3 class="category-title">Aventuras Radicais</h3>
                            <p class="category-description">Atividades de adrenalina para os mais corajosos.</p>
                        </div>
                    </div>
                    <div class="category-card" style="--category-color: #6b8e23;" data-category-title="Trilhas e Natureza">
                        <span class="category-icon">🌲</span>
                        <div>
                            <h3 class="category-title">Trilhas e Natureza</h3>
                            <p class="category-description">Explore a flora e fauna em trilhas ecológicas.</p>
                        </div>
                    </div>
                    <div class="category-card" style="--category-color: #8b4513;" data-category-title="Camping Noturno">
                        <span class="category-icon">🏕️</span>
                        <div>
                            <h3 class="category-title">Camping Noturno</h3>
                            <p class="category-description">Acampe sob as estrelas em locais seguros.</p>
                        </div>
                    </div>
                </div>
            </div>
            <aside class="sidebar">
                 <div class="quick-stats">
                    <h3 class="stats-title">Estatísticas do Clube</h3>
                    <div class="stat-item"><span>Grupos Formados</span> <strong id="group-count">--</strong></div>
                    <div class="stat-item"><span>Tarefas Agendadas</span> <strong id="tasks-count">--</strong></div>
                </div>
                <div id="scout-of-the-month-container"></div>
            </aside>
        </div>
    `;

    renderReminders(viewElement);
    renderScoutOfTheMonth(viewElement);

    // --- Lógica de estatísticas (igual à anterior) ---
    fetchApi('/api/groups?size=1')
        .then(groupPage => {
            const groupCount = groupPage.totalElements || 0;
            const groupCountEl = viewElement.querySelector('#group-count');
            if(groupCountEl) groupCountEl.textContent = groupCount;
        }).catch(error => {
            console.error("Erro ao buscar estatísticas de grupos:", error);
            const groupCountEl = viewElement.querySelector('#group-count');
            if(groupCountEl) groupCountEl.textContent = 'Erro';
        });

     const now = new Date();
     fetchApi(`/api/tasks?year=${now.getFullYear()}&month=${now.getMonth() + 1}&size=1`)
        .then(taskPage => {
            const tasksCountEl = viewElement.querySelector('#tasks-count');
            if(tasksCountEl) tasksCountEl.textContent = taskPage.totalElements;
        })
        .catch(error => {
             console.error("Erro ao buscar contagem de tarefas:", error);
             const tasksCountEl = viewElement.querySelector('#tasks-count');
             if(tasksCountEl) tasksCountEl.textContent = 'Erro';
        });
    // --- Fim da lógica de estatísticas ---


    // Substitui alert por showToast no clique das categorias
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.dataset.categoryTitle; // Usa o data attribute
            showToast(`Carregando categoria: ${title}`, 'info'); // Usa showToast
        });
    });
}