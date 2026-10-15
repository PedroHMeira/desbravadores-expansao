// js/views/admin/manage-users.js

// A função fetchApi e showToast estão disponíveis globalmente
import { showToast as toastFunc } from '../../ui/toast.js'; // Ajuste o caminho se necessário
import { escapeHtml } from '../../utils/sanitize.js';
if (typeof window.showToast === 'undefined') {
    window.showToast = toastFunc;
}

// Define o tamanho da página para AMBAS as listas
const USER_LIST_PAGE_SIZE = 5; 

/**
 * Função para renderizar os controlos de paginação (agora usada por ambas as listas)
 * @param {HTMLElement} paginationContainer - O <div id="user-list-pagination">
 * @param {HTMLElement} listContainer - O <div id="user-list-container"> (para recarregar)
 * @param {object} userPage - O objeto Page retornado da API
 * @param {string} role - O cargo ('DESBRAVADOR' ou 'MONITOR') para saber qual lista recarregar
 */
function renderPaginationControls(paginationContainer, listContainer, userPage, role) {
    paginationContainer.innerHTML = ''; // Limpa controlos antigos

    const { number, totalPages, first, last } = userPage; 

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first; 
    prevBtn.addEventListener('click', () => {
        loadList(listContainer, role, number - 1); // Recarrega a lista correta
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
        loadList(listContainer, role, number + 1); // Recarrega a lista correta
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}


/**
 * NOVO: Função ÚNICA para carregar listas (Desbravador OU Monitor)
 * @param {HTMLElement} container - O elemento onde a tabela será renderizada
 * @param {string} role - O cargo a carregar ('DESBRAVADOR' ou 'MONITOR')
 * @param {number} page - O número da página a carregar (0-indexado)
 */
async function loadList(container, role, page = 0) {
  try {
    if (!container) {
        console.error("Container da lista de utilizadores não foi encontrado.");
        return;
    }

    container.innerHTML = `<p>A carregar ${role === 'DESBRAVADOR' ? 'desbravadores' : 'monitores'}...</p>`;

    // Define o endpoint e os cabeçalhos da tabela com base no cargo
    let endpoint = '';
    let groupColumnHeader = '';

    if (role === 'DESBRAVADOR') {
        endpoint = `/api/admin/users?page=${page}&size=${USER_LIST_PAGE_SIZE}&sort=name,asc`;
        groupColumnHeader = 'Grupo';
    } else { // 'MONITOR'
        endpoint = `/api/admin/users/monitors?page=${page}&size=${USER_LIST_PAGE_SIZE}&sort=name,asc`;
        groupColumnHeader = 'Grupo (Liderado)';
    }

    const userPage = await fetchApi(endpoint);
    const users = userPage.content;

    let tableHtml = `<p>Nenhum utilizador (${role === 'DESBRAVADOR' ? 'Desbravador' : 'Monitor'}) encontrado.</p>`;

    if (users.length > 0) {
      tableHtml = `
        <table class="user-table">
          <thead>
            <tr>
              <th>Utilizador</th>
              <th>Email</th>
              <th>${groupColumnHeader}</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>
                  <div class="user-info-cell">
                    <img src="${escapeHtml(user.avatar) || 'img/escoteiro1.png'}" alt="Avatar" class="avatar-img-small">
                    <span>${escapeHtml(user.name)} ${escapeHtml(user.surname)}</span>
                  </div>
                </td>
                <td>${escapeHtml(user.email)}</td>
                <td>${user.group ? escapeHtml(user.group.name) : (role === 'DESBRAVADOR' ? 'Sem grupo' : 'Nenhum')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // Renderiza a tabela E o container da paginação
    container.innerHTML = `
        <div id="user-list-table-wrapper">
            ${tableHtml}
        </div>
        <div id="user-list-pagination" class="pagination-controls">
            </div>
    `;

    // Renderiza os controlos de paginação SE houver mais de 1 página
    const paginationContainer = container.querySelector("#user-list-pagination");
    if (userPage.totalPages > 1) {
        // Passa o 'role' para a função de paginação saber o que recarregar
        renderPaginationControls(paginationContainer, container, userPage, role);
    } else {
        paginationContainer.remove(); // Remove o container se não for necessário
    }

  } catch (error) {
    console.error(`Falha ao carregar lista de ${role}:`, error);
    container.innerHTML = `<p style="color: red;">Não foi possível carregar a lista. ${error.message}</p>`;
  }
}


export async function renderManageUsersView(viewElement) {

  // Exibe uma mensagem de carregamento inicial
  viewElement.innerHTML = `<div class="admin-widget"><p>A carregar formulário...</p></div>`;

  try {
    // 1. Busca a lista de grupos disponíveis na API (lógica existente)
    const groupPage = await fetchApi('/api/groups?page=0&size=999');
    const groupDetails = groupPage.content;
    const groups = groupDetails
        .map(detail => detail.group)
        .filter(group => group && group.id && group.name);
    const groupOptions = groups.map(group =>
      `<option value="${group.id}">${escapeHtml(group.name)}</option>`
    ).join('');

    // 2. Renderiza o HTML da view
    viewElement.innerHTML = `
          <div class="admin-widget">
              <h2>Adicionar Novo Utilizador (Admin)</h2>
              <form id="admin-user-form" class="user-form">
                   <div class="form-row">
                      <div class="form-group">
                          <label for="user-name">Nome</label>
                          <input type="text" id="user-name" required>
                      </div>
                      <div class="form-group">
                          <label for="user-surname">Sobrenome</label>
                          <input type="text" id="user-surname" required>
                      </div>
                  </div>
                  <div class="form-group">
                      <label for="user-email">Email</label>
                      <input type="email" id="user-email" required>
                  </div>
                  <div class="form-group">
                      <label for="user-password">Senha Provisória</label>
                      <input type="password" id="user-password" required>
                  </div>
                  <div class="form-row">
                      <div class="form-group">
                          <label for="user-group">Grupo (Opcional)</label>
                          <select id="user-group">
                              <option value="">Sem grupo</option>
                              ${groupOptions}
                          </select>
                      </div>
                      <div class="form-group">
                          <label for="user-role">Cargo</label>
                          <select id="user-role" required>
                              <option value="">Selecione um cargo...</option>
                              <option value="DESBRAVADOR">Desbravador (Aluno)</option>
                              <option value="MONITOR">Monitor</option>
                          </select>
                      </div>
                  </div>
                  <button type="submit" class="action-btn">Adicionar Utilizador</button>
              </form>
          </div>

          <div class="admin-widget">
              <div class="view-toggle-buttons">
                  <button id="view-desbravadores-btn" class="view-toggle-btn active" data-role="DESBRAVADOR">Desbravadores</button>
                  <button id="view-monitores-btn" class="view-toggle-btn" data-role="MONITOR">Monitores</button>
              </div>
              
              <div id="user-list-container">
                  </div>
          </div>
      `;

    // 3. Adiciona o listener ao formulário (lógica existente)
    const userForm = viewElement.querySelector("#admin-user-form");
    const userListContainer = viewElement.querySelector("#user-list-container");
    
    // Referências e listeners para os botões das abas
    const desbravadoresBtn = viewElement.querySelector("#view-desbravadores-btn");
    const monitoresBtn = viewElement.querySelector("#view-monitores-btn");

    desbravadoresBtn.addEventListener('click', () => {
        monitoresBtn.classList.remove('active');
        desbravadoresBtn.classList.add('active');
        loadList(userListContainer, 'DESBRAVADOR', 0); // Usa a nova função
    });

    monitoresBtn.addEventListener('click', () => {
        desbravadoresBtn.classList.remove('active');
        monitoresBtn.classList.add('active');
        loadList(userListContainer, 'MONITOR', 0); // Usa a nova função
    });


    userForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = userForm.querySelector('button[type="submit"]');

      const groupIdValue = viewElement.querySelector("#user-group").value;
      const groupId = groupIdValue && !isNaN(parseInt(groupIdValue, 10)) ? parseInt(groupIdValue, 10) : null;
      const groupPayload = groupId !== null ? { id: groupId } : null;

      const newUser = {
        name: viewElement.querySelector("#user-name").value,
        surname: viewElement.querySelector("#user-surname").value,
        email: viewElement.querySelector("#user-email").value,
        password: viewElement.querySelector("#user-password").value,
        role: viewElement.querySelector("#user-role").value,
        group: groupPayload,
        avatar: 'img/escoteiro1.png', // Avatar padrão
        level: 1, // Nível inicial padrão
        xp: 0    // XP inicial padrão
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Adicionando...';

      try {
        const createdUser = await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(newUser),
        });
        showToast(`Utilizador ${createdUser.name} ${createdUser.surname} adicionado com sucesso!`, 'success'); 
        userForm.reset();

        // MODIFICADO: Recarrega a aba que o utilizador acabou de criar
        if (createdUser.role === 'DESBRAVADOR') {
            if (!desbravadoresBtn.classList.contains('active')) {
                desbravadoresBtn.click();
            } else {
                await loadList(userListContainer, 'DESBRAVADOR', 0);
            }
        } else if (createdUser.role === 'MONITOR') {
            if (!monitoresBtn.classList.contains('active')) {
                monitoresBtn.click();
            } else {
                await loadList(userListContainer, 'MONITOR', 0);
            }
        }

      } catch (error) {
        console.error("Falha ao criar utilizador:", error);
        showToast(`Erro ao criar utilizador: ${error.message}`, 'error'); 
      } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Adicionar Utilizador';
      }
    });

    // 4. Carrega a lista inicial de Desbravadores (página 0)
    await loadList(userListContainer, 'DESBRAVADOR', 0);

  } catch (error)
 {
    console.error("Falha ao carregar a view de criação de utilizadores:", error);
    viewElement.innerHTML = `<div class="admin-widget"><p style="color: red;">Não foi possível carregar os grupos. ${error.message}</p></div>`;
  }
}