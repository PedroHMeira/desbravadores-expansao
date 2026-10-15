// js/views/admin/manage-tasks.js

// A função fetchApi está disponível globalmente
// Importa showModal e showToast com os caminhos corretos
import { showModal } from '../../../components/modal.js';
import { showToast as toastFunc } from '../../ui/toast.js'; // Caminho corrigido
import { escapeHtml } from '../../utils/sanitize.js';

// Garante que showToast esteja disponível globalmente
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

// --- NOVO ESTADO E CONSTANTES ---
let editingTaskId = null;
let currentTaskPage = 0; // Rastreia a página atual
const TASK_PAGE_SIZE = 10; // Define o tamanho da página
// --- FIM NOVO ESTADO ---


// Função auxiliar para criar corpo do modal de confirmação
function createConfirmationModalBody(message, confirmCallback) {
    const container = document.createElement('div');
    container.innerHTML = `<p>${message}</p>`;
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    confirmButton.className = 'action-btn'; // Use uma classe de botão apropriada
    confirmButton.style.marginTop = '1rem';
    confirmButton.onclick = () => {
        confirmCallback();
        document.getElementById('closeModalBtn').click(); // Fecha o modal após confirmar
    };
    container.appendChild(confirmButton);
    return container;
}

/**
 * NOVO: Função para renderizar os controlos de paginação
 * (Baseada em manage-users.js)
 */
function renderPaginationControls(paginationContainer, viewElement, taskPage, loadFunction) {
    paginationContainer.innerHTML = ''; // Limpa controlos antigos

    const { number, totalPages, first, last } = taskPage;
    currentTaskPage = number; // Atualiza o estado global

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => {
        loadFunction(viewElement, number - 1);
    });

    // Informação da Página
    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Página ${number + 1} de ${totalPages}`;

    // Botão "Próxima"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = 'Próxima <i class="fa-solid fa-arrow-right"></i>';
    nextBtn.disabled = last;
    nextBtn.addEventListener('click', () => {
        loadFunction(viewElement, number + 1);
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}


/**
 * FUNÇÃO ATUALIZADA: Renomeada e modificada para paginação
 * @param {HTMLElement} viewElement 
 * @param {number} page - O número da página a carregar
 */
async function loadAndRenderTasks(viewElement, page = 0) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // API espera 1-12

    const taskListContainer = viewElement.querySelector('#task-list-data');
    taskListContainer.innerHTML = '<p>A carregar tarefas...</p>';

    try {
        // ATUALIZADO: Fetch com parâmetros de paginação e ordenação
        const endpoint = `/api/tasks?year=${currentYear}&month=${currentMonth}&page=${page}&size=${TASK_PAGE_SIZE}&sort=date,asc&sort=time,asc`;
        const taskPage = await fetchApi(endpoint);
        const tasks = taskPage.content; // Tarefas estão dentro de 'content'

        if (taskPage.totalElements === 0) {
            taskListContainer.innerHTML = `<p>Nenhuma tarefa agendada para este mês (${currentMonth}/${currentYear}).</p>`;
            return;
        }
        
        // A ordenação agora é feita pela API (sort=date,asc&sort=time,asc)

        taskListContainer.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Título</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${tasks.map(task => {
                        // ... (renderização da linha <TR> permanece a mesma) ...
                        const dateObj = new Date(task.date + 'T00:00:00'); // Evita problemas de fuso horário
                        const dateFormatted = dateObj.toLocaleDateString('pt-BR');
                        const timeFormatted = task.time.substring(0, 5);

                        // Se esta for a tarefa em edição, renderiza o formulário
                        if (editingTaskId === task.id) {
                            return `
                                <tr data-task-id="${task.id}" class="editing-row">
                                    <td colspan="5">
                                        <form class="edit-task-form" data-task-id="${task.id}">
                                            <div class="form-row">
                                                <div class="form-group"><label>Data</label><input type="date" name="date" value="${task.date}" required></div>
                                                <div class="form-group"><label>Hora</label><input type="time" name="time" value="${task.time}" required></div>
                                                <div class="form-group"><label>Título</label><input type="text" name="title" value="${escapeHtml(task.title)}" required></div>
                                            </div>
                                            <div class="form-group">
                                                <label>Descrição</label>
                                                <textarea name="description">${escapeHtml(task.description || '')}</textarea>
                                            </div>
                                            <div class="form-actions">
                                                <button type="submit" class="btn-action save">
                                                    <i class="fa-solid fa-check"></i> Salvar
                                                </button>
                                                <button type="button" class="btn-action cancel cancel-edit-btn">
                                                    <i class="fa-solid fa-times"></i> Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                </tr>
                            `;
                        }

                        // Modo de visualização padrão
                        return `
                            <tr data-task-id="${task.id}">
                                <td>${dateFormatted}</td>
                                <td>${timeFormatted}</td>
                                <td>${escapeHtml(task.title)}</td>
                                <td title="${escapeHtml(task.description || 'Sem descrição.')}">${escapeHtml((task.description || '').substring(0, 30))}${(task.description || '').length > 30 ? '...' : ''}</td>
                                <td class="actions-cell">
                                    <button class="btn-action-icon edit edit-task-btn" title="Editar Tarefa" data-task-id="${task.id}">
                                        <i class="fa-solid fa-pencil"></i>
                                    </button>
                                    <button class="btn-action-icon delete delete-task-btn" title="Apagar Tarefa" data-task-id="${task.id}">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div id="task-list-pagination" class="pagination-controls" style="margin-top: 1rem;"></div>
        `;

        // --- NOVO: Renderiza controles de paginação ---
        const paginationContainer = viewElement.querySelector("#task-list-pagination");
        if (taskPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, viewElement, taskPage, loadAndRenderTasks);
        } else {
            paginationContainer.remove();
        }

        // --- LISTENERS DE AÇÃO (ATUALIZADOS) ---

        // 1. Apagar tarefa
        taskListContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.taskId;
                const row = e.currentTarget.closest('tr');
                const taskTitle = row.querySelector('td:nth-child(3)').textContent;

                const modalBody = createConfirmationModalBody(`Tem a certeza que deseja APAGAR a tarefa: "${escapeHtml(taskTitle)}"?`, async () => {
                     btn.disabled = true;
                     btn.textContent = 'Apagando...';
                    try {
                        await fetchApi(`/api/tasks/${taskId}`, { method: 'DELETE' });
                        showToast(`Tarefa "${taskTitle}" apagada com sucesso!`, 'success');
                        editingTaskId = null;
                        loadAndRenderTasks(viewElement, currentTaskPage); // ATUALIZADO
                    } catch (error) {
                        showToast(`Erro ao apagar tarefa: ${error.message}`, 'error');
                        btn.disabled = false;
                        btn.textContent = 'Apagar';
                    }
                });
                showModal('Confirmar Exclusão', modalBody);
            });
        });

        // 2. Iniciar Edição
        taskListContainer.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                editingTaskId = parseInt(e.currentTarget.dataset.taskId, 10);
                loadAndRenderTasks(viewElement, currentTaskPage); // ATUALIZADO
            });
        });

        // 3. Cancelar Edição
        taskListContainer.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                editingTaskId = null;
                loadAndRenderTasks(viewElement, currentTaskPage); // ATUALIZADO
            });
        });

        // 4. Salvar Edição
        const editForm = taskListContainer.querySelector('.edit-task-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const taskId = editForm.dataset.taskId;
                const saveButton = editForm.querySelector('button[type="submit"]');

                const payload = {
                    title: editForm.elements.title.value,
                    description: editForm.elements.description.value,
                    date: editForm.elements.date.value,
                    time: editForm.elements.time.value,
                };

                saveButton.textContent = 'Salvando...';
                saveButton.disabled = true;

                try {
                    await fetchApi(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });

                    showToast('Tarefa atualizada com sucesso!', 'success');
                    editingTaskId = null;
                    loadAndRenderTasks(viewElement, currentTaskPage); // ATUALIZADO

                } catch (error) {
                    showToast(`Erro ao salvar tarefa: ${error.message}`, 'error');
                    saveButton.textContent = 'Salvar';
                    saveButton.disabled = false;
                }
            });
        }

    } catch (error) {
        taskListContainer.innerHTML = `<p style="color: red;">Erro ao carregar lista de tarefas: ${error.message}</p>`;
    }
}


export function renderManageTasksView(viewElement) {
  viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Adicionar Nova Tarefa na Agenda</h2>
            <form id="task-form" class="task-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="task-date">Data</label>
                        <input type="date" id="task-date" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="task-time">Hora</label>
                        <input type="time" id="task-time" class="form-control" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="task-title">Título da Tarefa</label>
                    <input type="text" id="task-title" class="form-control" placeholder="Ex: Trilha Ecológica" required>
                </div>
                <div class="form-group">
                    <label for="task-description">Descrição</label>
                    <textarea id="task-description" class="form-control" placeholder="Detalhes da atividade..."></textarea>
                </div>
                <button type="submit" class="action-btn">Adicionar Tarefa</button>
            </form>
        </div>

        <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Tarefas Agendadas (Mês Atual)</h2>
            <div id="task-list-data">
                </div>
        </div>
    `;

  const taskForm = viewElement.querySelector("#task-form");
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitButton = taskForm.querySelector('button[type="submit"]');

    const newTask = {
      date: viewElement.querySelector("#task-date").value,
      time: viewElement.querySelector("#task-time").value,
      title: viewElement.querySelector("#task-title").value,
      description: viewElement.querySelector("#task-description").value,
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Adicionando...';

    try {
        await fetchApi('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(newTask)
        });

        showToast(`Tarefa "${newTask.title}" adicionada com sucesso!`, 'success');
        taskForm.reset();
        loadAndRenderTasks(viewElement, 0); // ATUALIZADO: Recarrega na página 0

    } catch (error) {
        console.error("Falha ao criar tarefa:", error);
        showToast(`Erro ao criar tarefa: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Adicionar Tarefa';
    }
  });

  // ATUALIZADO: Renderiza a lista de tarefas (página 0) ao carregar a vista
  loadAndRenderTasks(viewElement, 0);
}