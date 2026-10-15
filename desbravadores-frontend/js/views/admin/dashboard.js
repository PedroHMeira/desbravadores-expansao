// js/views/admin/dashboard.js

// A função fetchApi está disponível globalmente

import { escapeHtml } from '../../utils/sanitize.js';

// --- ESTADO LOCAL PARA PAGINAÇÃO ---
let currentPage = 0;
const pageSize = 5; // Define 5 registros por página

// Helper function para obter o cargo do utilizador a partir do token (reutilizado do admin-main.js)
function getUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (error) {
        return null;
    }
}

// --- FUNÇÃO PARA RENDERIZAR CONTROLES DE PAGINAÇÃO ---
function renderPaginationControls(viewElement, page) {
    const paginationContainer = viewElement.querySelector('#user-pagination-controls');
    if (!paginationContainer) return;
    
    // Remove a classe 'active' de todos os botões de página (se existirem)
    paginationContainer.innerHTML = ''; 

    // Botão Anterior
    const prevDisabled = page.number === 0 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="prevPageBtn" class="pagination-btn" ${prevDisabled}>Anterior</button>`;

    // Renderiza botões de número de página
    for (let i = 0; i < page.totalPages; i++) {
        const activeClass = page.number === i ? 'active' : '';
        paginationContainer.innerHTML += `<button class="pagination-btn page-number-btn ${activeClass}" data-page="${i}">${i + 1}</button>`;
    }

    // Botão Próximo
    const nextDisabled = page.number === page.totalPages - 1 ? 'disabled' : '';
    paginationContainer.innerHTML += `<button id="nextPageBtn" class="pagination-btn" ${nextDisabled}>Próximo</button>`;
    
    // Adiciona Listeners
    viewElement.querySelector('#prevPageBtn').addEventListener('click', () => {
        if (page.number > 0) {
            currentPage = page.number - 1;
            renderDashboardData(viewElement);
        }
    });

    viewElement.querySelector('#nextPageBtn').addEventListener('click', () => {
        if (page.number < page.totalPages - 1) {
            currentPage = page.number + 1;
            renderDashboardData(viewElement);
        }
    });
    
    viewElement.querySelectorAll('.page-number-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPage = parseInt(e.target.dataset.page, 10);
            renderDashboardData(viewElement);
        });
    });
}


async function renderUserList(viewElement, groupId = null) {
    const userListContainer = viewElement.querySelector('#user-list-container');
    userListContainer.innerHTML = `<p>A carregar lista de utilizadores...</p>`;

    try {
        // Inclui parâmetros de paginação e o groupId para o filtro
        let endpoint = `/api/admin/users?page=${currentPage}&size=${pageSize}`;
        if (groupId) {
            endpoint += `&groupId=${groupId}`;
        }
        
        // A API agora retorna um objeto Page<User>
        const responsePage = await fetchApi(endpoint); 
        const scouts = responsePage.content;
        
        // Se a página atual não tiver conteúdo, volta para a anterior (previne páginas vazias)
        if (scouts.length === 0 && responsePage.totalPages > 0 && currentPage > 0) {
            currentPage = Math.max(0, responsePage.totalPages - 1);
            return renderUserList(viewElement, groupId); 
        }

        if (scouts.length === 0) {
            userListContainer.innerHTML = '<p>Nenhum desbravador encontrado.</p>';
            viewElement.querySelector('#user-pagination-controls').innerHTML = '';
            return;
        }
        
        userListContainer.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Grupo</th>
                        <th>Nível</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${scouts.map(user => `
                        <tr>
                            <td>
                                <div class="user-info-cell">
                                    <img src="${escapeHtml(user.avatar) || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img-small" />
                                    <span>${escapeHtml(user.name)} ${escapeHtml(user.surname)}</span>
                                </div>
                            </td>
                            <td>${user.group ? escapeHtml(user.group.name) : 'Sem grupo'}</td>
                            <td>${user.level}</td>
                            <td>
                                <button class="action-btn-small manage-user-btn" data-user-id="${user.id}">Gerir</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Renderiza os controles de paginação
        renderPaginationControls(viewElement, responsePage);
        
    } catch (error) {
        console.error("Falha ao carregar utilizadores:", error);
        userListContainer.innerHTML = `<p style="color: red;">Não foi possível carregar a lista de utilizadores.</p>`;
    }
}


async function renderReportWidget(viewElement) {
    const role = getUserRole();
    const isDirector = role === 'DIRETOR';
    const today = new Date().toISOString().split('T')[0];
    let groupOptionsHTML = '';
    let fetchedGroups = [];

    if (isDirector) {
        try {
            // AQUI ESTÁ A CORREÇÃO: Chamamos a API sem paginação para obter TODOS os grupos para o filtro
            const groupPage = await fetchApi('/api/groups?page=0&size=999'); 
            
            // CORREÇÃO CRÍTICA: Extrai o array da propriedade .content
            const groupDetails = groupPage.content;
            
            fetchedGroups = groupDetails
                .map(detail => detail.group) 
                .filter(group => group && group.id && group.name);
            
            groupOptionsHTML = fetchedGroups.map(group =>
                `<option value="${group.id}">${escapeHtml(group.name)}</option>`
            ).join('');
            
        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
            groupOptionsHTML = '<option value="">Erro ao carregar</option>';
        }
    }
    
    const groupSelectorHTML = isDirector ? `
        <div class="form-group" style="flex: 1;">
            <label for="report-group">Selecione o Grupo:</label>
            <select id="report-group" class="form-control">
                <option value="">Todos os Desbravadores</option>
                ${groupOptionsHTML}
            </select>
        </div>
    ` : '';

    viewElement.querySelector('#report-widget-container').innerHTML = `
        <div class="admin-widget">
            <h2>Relatório de Presença</h2>
            <div class="form-row" style="align-items: flex-end; gap: 1rem;">
                ${groupSelectorHTML}
                <div class="form-group" style="flex: 1;">
                    <label for="report-date">Selecione a data:</label>
                    <input type="date" id="report-date" class="form-control" value="${today}">
                </div>
                <div class="form-group" style="flex-grow: 0;">
                    <button id="generate-report-btn" class="action-btn" style="width: auto; padding: 12px 20px;">Gerar Relatório</button>
                </div>
            </div>
            <div id="report-container" class="printable-area" style="margin-top: 1.5rem;">
                </div>
        </div>
    `;

    const generateReportBtn = viewElement.querySelector('#generate-report-btn');
    const reportContainer = viewElement.querySelector('#report-container');
    const reportDateInput = viewElement.querySelector('#report-date');
    const reportGroupInput = viewElement.querySelector('#report-group'); 

    generateReportBtn.addEventListener('click', async () => {
        const selectedDate = reportDateInput.value;
        let selectedGroupId = null;

        if (!selectedDate) {
            alert('Por favor, selecione uma data.');
            return;
        }

        if (isDirector) {
            selectedGroupId = reportGroupInput.value;
            if (selectedGroupId === "") { 
                selectedGroupId = null;
            }
        }
        
        reportContainer.innerHTML = '<p>A gerar relatório...</p>';

        try {
            const queryParams = new URLSearchParams({ date: selectedDate });
            if (selectedGroupId) {
                queryParams.append('groupId', selectedGroupId);
            }
            
            const reportData = await fetchApi(`/api/chamada/report?${queryParams.toString()}`);
            
            if (reportData.length === 0) {
                reportContainer.innerHTML = `<p>Nenhuma chamada encontrada para este dia ou ${selectedGroupId ? 'o grupo não tem desbravadores.' : 'nenhum desbravador foi encontrado.'}</p>`;
                return;
            }

            reportContainer.innerHTML = `
                <h3>Relatório de Presença - ${new Date(selectedDate).toLocaleDateString()}</h3>
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Nome do Aluno</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(item => `
                            <tr>
                                <td>${escapeHtml(item.name)}</td>
                                <td class="status-${item.status.toLowerCase()}">${item.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button id="print-report-btn" class="action-btn" style="width: auto; padding: 10px 15px; margin-top: 1rem;">Imprimir</button>
            `;
            
            viewElement.querySelector('#print-report-btn').addEventListener('click', () => {
                const printableContent = reportContainer.cloneNode(true);
                const printButton = printableContent.querySelector('#print-report-btn');
                if(printButton) {
                    printButton.remove(); 
                }
                const printContents = printableContent.innerHTML;

                const printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Relatório de Presença</title>');
                printWindow.document.write('<link rel="stylesheet" href="css/main.css">');
                printWindow.document.write('<link rel="stylesheet" href="css/admin.css">');
                printWindow.document.write('</head><body onload="window.print(); window.close();">');
                printWindow.document.write('<div class="printable-area">'); 
                printWindow.document.write(printContents);
                printWindow.document.write('</div>');
                printWindow.document.write('</body></html>');
                printWindow.document.close();
            });

        } catch (error) {
            reportContainer.innerHTML = `<p style="color: red;">Erro ao gerar relatório: ${error.message}</p>`;
        }
    });

    if (isDirector && reportGroupInput) {
        reportGroupInput.addEventListener('change', (e) => {
            // Reseta para a primeira página ao mudar o filtro
            currentPage = 0; 
            renderDashboardData(viewElement);
        });
    }
}

// Função principal de renderização do Dashboard (Chama ambos os widgets)
function renderDashboardData(viewElement) {
    // Renderiza o widget de relatório
    renderReportWidget(viewElement);
    
    // Renderiza o widget de lista de usuários
    const role = getUserRole();
    const isDirector = role === 'DIRETOR';
    
    // Variável renomeada para evitar conflito (acessa o elemento após ele ser renderizado por renderReportWidget)
    const currentGroupInput = viewElement.querySelector('#report-group'); 
    
    let currentGroupId = null;
    if (isDirector && currentGroupInput) {
        currentGroupId = currentGroupInput.value === "" ? null : currentGroupInput.value;
    }
    
    // Renderiza a lista de usuários com o estado atual da página
    renderUserList(viewElement, currentGroupId);
}


export async function renderDashboardView(viewElement) {
    viewElement.innerHTML = `
        <div id="report-widget-container">
             <p>A carregar widget de relatório...</p>
        </div>

        <div class="admin-widget" style="margin-top: 2rem;">
            <h2>Visão Geral dos Desbravadores</h2>
            <div id="user-list-container">
                <p>A carregar lista de utilizadores...</p>
            </div>
            <div id="user-pagination-controls" class="pagination-controls">
                </div>
        </div>
    `;
    
    // O renderDashboardData fará toda a inicialização e rendering
    renderDashboardData(viewElement);
}