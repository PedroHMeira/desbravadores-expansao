// js/views/admin/create-item.js

// NOVO: Importa modal para confirmação de exclusão
import { showModal } from '../../../components/modal.js';
import { escapeHtml } from '../../utils/sanitize.js';

// --- NOVO ESTADO ---
const ITEM_PAGE_SIZE = 5; 
let editingAchievementId = null;
let editingBackgroundId = null;
// --- FIM NOVO ESTADO ---


/**
 * NOVO: Função para renderizar os controlos de paginação
 * (Idêntica à de manage-tasks)
 */
function renderPaginationControls(paginationContainer, container, itemPage, loadFunction) {
    paginationContainer.innerHTML = ''; // Limpa controlos antigos

    const { number, totalPages, first, last } = itemPage;

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Anterior';
    prevBtn.disabled = first;
    prevBtn.addEventListener('click', () => {
        loadFunction(container, number - 1); // Recarrega a lista
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
        loadFunction(container, number + 1); // Recarrega a lista
    });

    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(info);
    paginationContainer.appendChild(nextBtn);
}


/**
 * FUNÇÃO ATUALIZADA para paginação e gerenciamento
 * @param {HTMLElement} container - O elemento <div id="achievements-list">
 * @param {number} page - O número da página
 */
async function loadAndRenderAchievements(container, page = 0) {
    try {
        const endpoint = `/api/admin/achievements?page=${page}&size=${ITEM_PAGE_SIZE}&sort=name,asc`;
        const achievementPage = await fetchApi(endpoint);
        const achievements = achievementPage.content;
        
        if (achievementPage.totalElements > 0) {
            container.innerHTML = achievements.map(ach => {
                
                // NOVO: Renderiza formulário de edição
                if (editingAchievementId === ach.id) {
                    return `
                    <div class="list-item-preview editing-row">
                        <form class="edit-achievement-form" data-id="${ach.id}" style="width: 100%;">
                            <div class="form-group">
                                <label>Nome</label>
                                <input type="text" name="name" value="${escapeHtml(ach.name)}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Descrição</label>
                                <textarea name="description" class="form-control" required>${escapeHtml(ach.description)}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>XP</label>
                                    <input type="number" name="xpReward" value="${ach.xpReward}" class="form-control" required>
                                </div>
                                <div class="form-group">
                                    <label>Tipo</label>
                                    <select name="rewardType" class="form-control" required>
                                        <option value="BADGE" ${ach.rewardType === 'BADGE' ? 'selected' : ''}>Emblema</option>
                                        <option value="SEAL" ${ach.rewardType === 'SEAL' ? 'selected' : ''}>Selo</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Novo Ícone (Opcional)</label>
                                <input type="file" name="iconFile" class="form-control" accept="image/*">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-action save">
                                    <i class="fa-solid fa-check"></i> Salvar
                                </button>
                                <button type="button" class="btn-action cancel cancel-edit-ach-btn">
                                    <i class="fa-solid fa-times"></i> Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                    `;
                }
                
                // Renderização Padrão
                return `
                <div class="list-item-preview">
                    <img src="${window.API_BASE_URL}${ach.icon.replace('/uploads/', '/file/')}" alt="${escapeHtml(ach.name)}" class="preview-icon">
                    <span style="flex: 1;"><strong>${escapeHtml(ach.name)}</strong><br><small>${escapeHtml(ach.description.substring(0, 50))}...</small></span>
                    <div class="item-actions">
                         <button class="btn-action-icon edit edit-ach-btn" title="Editar Conquista" data-id="${ach.id}">
                            <i class="fa-solid fa-pencil"></i>
                         </button>
                         <button class="btn-action-icon delete delete-ach-btn" title="Apagar Conquista" data-id="${ach.id}" data-name="${escapeHtml(ach.name)}">
                            <i class="fa-solid fa-trash-can"></i>
                         </button>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhuma conquista criada ainda.</p>';
        }

        // NOVO: Renderiza paginação
        const paginationContainer = container.nextElementSibling; // Pega o <div id="achievements-list-pagination">
        if (achievementPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, achievementPage, loadAndRenderAchievements);
        } else {
            paginationContainer.innerHTML = '';
        }
        
        // NOVO: Adiciona listeners
        addAchievementListeners(container, page);

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar conquistas: ${error.message}</p>`;
    }
}

/**
 * NOVO: Adiciona listeners para botões de Conquista
 */
function addAchievementListeners(container, currentPage) {
    const listContainer = document.getElementById('achievements-list');

    // 1. Apagar
    container.querySelectorAll('.delete-ach-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const name = e.currentTarget.dataset.name;
            
            const modalBody = document.createElement('div');
            modalBody.innerHTML = `<p>Tem a certeza que quer apagar a conquista "<strong>${escapeHtml(name)}</strong>"?</p>`;
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.className = 'action-btn';
            confirmBtn.onclick = async () => {
                try {
                    await fetchApi(`/api/admin/achievements/${id}`, { method: 'DELETE' });
                    showToast('Conquista apagada!', 'success');
                    editingAchievementId = null;
                    loadAndRenderAchievements(listContainer, currentPage);
                } catch (error) {
                    showToast(`Erro ao apagar: ${error.message}`, 'error');
                }
                document.getElementById('closeModalBtn').click();
            };
            modalBody.appendChild(confirmBtn);
            showModal('Apagar Conquista', modalBody);
        });
    });

    // 2. Iniciar Edição
    container.querySelectorAll('.edit-ach-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingAchievementId = parseInt(e.currentTarget.dataset.id, 10);
            loadAndRenderAchievements(listContainer, currentPage);
        });
    });

    // 3. Cancelar Edição
    container.querySelectorAll('.cancel-edit-ach-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editingAchievementId = null;
            loadAndRenderAchievements(listContainer, currentPage);
        });
    });

    // 4. Salvar Edição
    const editForm = container.querySelector('.edit-achievement-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            const submitButton = e.currentTarget.querySelector('button[type="submit"]');

            // Constrói o FormData
            const formData = new FormData();
            formData.append('name', e.currentTarget.elements.name.value);
            formData.append('description', e.currentTarget.elements.description.value);
            formData.append('xpReward', e.currentTarget.elements.xpReward.value);
            formData.append('rewardType', e.currentTarget.elements.rewardType.value);
            
            const iconFile = e.currentTarget.elements.iconFile.files[0];
            if (iconFile) {
                formData.append('iconFile', iconFile);
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                await fetchApi(`/api/admin/achievements/${id}`, { method: 'PUT', body: formData });
                showToast('Conquista atualizada!', 'success');
                editingAchievementId = null;
                loadAndRenderAchievements(listContainer, currentPage);
            } catch (error) {
                showToast(`Erro ao salvar: ${error.message}`, 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar';
            }
        });
    }
}


/**
 * FUNÇÃO ATUALIZADA para paginação e gerenciamento
 * @param {HTMLElement} container - O elemento <div id="backgrounds-list">
 * @param {number} page - O número da página
 */
async function loadAndRenderBackgrounds(container, page = 0) {
    try {
        const endpoint = `/api/backgrounds?page=${page}&size=${ITEM_PAGE_SIZE}&sort=name,asc`;
        const backgroundPage = await fetchApi(endpoint);
        const backgrounds = backgroundPage.content;
        
        if (backgroundPage.totalElements > 0) {
            container.innerHTML = backgrounds.map(bg => {
                const style = bg.imageUrl
                    ? `background: url(${window.API_BASE_URL}${bg.imageUrl.replace('/uploads/', '/file/')}) center/cover no-repeat; color: ${escapeHtml(bg.textColor)};`
                    : `background: ${escapeHtml(bg.gradient)}; color: ${escapeHtml(bg.textColor)};`;
                
                // NOVO: Renderiza formulário de edição
                if (editingBackgroundId === bg.id) {
                     return `
                    <div class="list-item-preview editing-row">
                        <form class="edit-background-form" data-id="${bg.id}" style="width: 100%;">
                            <div class="form-group">
                                <label>Nome</label>
                                <input type="text" name="name" value="${escapeHtml(bg.name)}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Cor do Texto (ex: #FFFFFF)</label>
                                <input type="text" name="textColor" value="${escapeHtml(bg.textColor)}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Gradiente (ex: linear-gradient(to right, #ff7e5f, #feb47b))</label>
                                <input type="text" name="gradient" value="${escapeHtml(bg.gradient || '')}" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Nova Imagem (Opcional)</label>
                                <input type="file" name="imageFile" class="form-control" accept="image/*">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-action save">
                                    <i class="fa-solid fa-check"></i> Salvar
                                </button>
                                <button type="button" class="btn-action cancel cancel-edit-bg-btn">
                                    <i class="fa-solid fa-times"></i> Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                    `;
                }
                
                // Renderização Padrão
                return `
                    <div class="list-item-preview" style="${style}">
                        <span style="background-color: rgba(0,0,0,0.5); padding: 5px; border-radius: 5px; flex: 1;"><strong>${escapeHtml(bg.name)}</strong></span>
                        <div class="item-actions">
                             <button class="btn-action-icon edit edit-bg-btn" title="Editar Fundo" data-id="${bg.id}">
                                <i class="fa-solid fa-pencil"></i>
                             </button>
                             <button class="btn-action-icon delete delete-bg-btn" title="Apagar Fundo" data-id="${bg.id}" data-name="${escapeHtml(bg.name)}">
                                <i class="fa-solid fa-trash-can"></i>
                             </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>Nenhum fundo criado ainda.</p>';
        }

        // NOVO: Renderiza paginação
        const paginationContainer = container.nextElementSibling; // Pega o <div id="backgrounds-list-pagination">
        if (backgroundPage.totalPages > 1) {
            renderPaginationControls(paginationContainer, container, backgroundPage, loadAndRenderBackgrounds);
        } else {
            paginationContainer.innerHTML = '';
        }
        
        // NOVO: Adiciona listeners
        addBackgroundListeners(container, page);
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erro ao carregar fundos: ${error.message}</p>`;
    }
}

/**
 * NOVO: Adiciona listeners para botões de Fundo
 */
function addBackgroundListeners(container, currentPage) {
    const listContainer = document.getElementById('backgrounds-list');

    // 1. Apagar
    container.querySelectorAll('.delete-bg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const name = e.currentTarget.dataset.name;
            
            const modalBody = document.createElement('div');
            modalBody.innerHTML = `<p>Tem a certeza que quer apagar o fundo "<strong>${escapeHtml(name)}</strong>"?</p>`;
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.className = 'action-btn';
            confirmBtn.onclick = async () => {
                try {
                    await fetchApi(`/api/admin/backgrounds/${id}`, { method: 'DELETE' });
                    showToast('Fundo apagado!', 'success');
                    editingBackgroundId = null;
                    loadAndRenderBackgrounds(listContainer, currentPage);
                } catch (error) {
                    showToast(`Erro ao apagar: ${error.message}`, 'error');
                }
                document.getElementById('closeModalBtn').click();
            };
            modalBody.appendChild(confirmBtn);
            showModal('Apagar Fundo', modalBody);
        });
    });

    // 2. Iniciar Edição
    container.querySelectorAll('.edit-bg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingBackgroundId = parseInt(e.currentTarget.dataset.id, 10);
            loadAndRenderBackgrounds(listContainer, currentPage);
        });
    });

    // 3. Cancelar Edição
    container.querySelectorAll('.cancel-edit-bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editingBackgroundId = null;
            loadAndRenderBackgrounds(listContainer, currentPage);
        });
    });

    // 4. Salvar Edição
    const editForm = container.querySelector('.edit-background-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = e.currentTarget.dataset.id;
            const submitButton = e.currentTarget.querySelector('button[type="submit"]');

            const formData = new FormData();
            formData.append('name', e.currentTarget.elements.name.value);
            formData.append('textColor', e.currentTarget.elements.textColor.value);
            formData.append('gradient', e.currentTarget.elements.gradient.value);
            
            const imageFile = e.currentTarget.elements.imageFile.files[0];
            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            try {
                await fetchApi(`/api/admin/backgrounds/${id}`, { method: 'PUT', body: formData });
                showToast('Fundo atualizado!', 'success');
                editingBackgroundId = null;
                loadAndRenderBackgrounds(listContainer, currentPage);
            } catch (error) {
                showToast(`Erro ao salvar: ${error.message}`, 'error');
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar';
            }
        });
    }
}


export function renderCreateItemView(viewElement) {
    viewElement.innerHTML = `
        <div class="admin-widget">
            <h2>Criar Novo Item de Gamificação</h2>
            
            <div class="form-group">
                <label for="item-type-selector">Selecione o tipo de item a criar:</label>
                <select id="item-type-selector" class="form-control">
                    <option value="achievement">🏆 Conquista</option>
                    <option value="background">Fundo de Perfil</option>
                </select>
            </div>

            <form id="create-achievement-form" class="user-form" style="display: block;">
                <h4>Nova Conquista</h4>
                <div class="form-group">
                    <label for="ach-name">Nome da Conquista</label>
                    <input type="text" id="ach-name" class="form-control" placeholder="Ex: Mestre do Acampamento" required>
                </div>
                <div class="form-group">
                    <label for="ach-description">Descrição (Requisitos para Desbloqueio)</label>
                    <textarea id="ach-description" class="form-control" placeholder="Ex: O monitor deve conceder esta conquista ao aluno que demonstrar habilidade exemplar em montar uma barraca." required></textarea>
                </div>
                <div class="form-row">
                     <div class="form-group">
                        <label for="ach-xp-reward">Recompensa de XP</label>
                        <input type="number" id="ach-xp-reward" class="form-control" min="0" value="50" required>
                    </div>
                    <div class="form-group">
                        <label for="ach-reward-type">Tipo de Prêmio</label>
                        <select id="ach-reward-type" class="form-control" required>
                            <option value="BADGE">Emblema</option>
                            <option value="SEAL">Selo</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="ach-icon-file">Ícone da Conquista</label>
                    <input type="file" id="ach-icon-file" class="form-control" accept="image/*" required>
                </div>
                <button type="submit" class="action-btn">Criar Conquista</button>
            </form>

            <form id="create-background-form" class="user-form" style="display: none;">
                <h4>Novo Fundo de Perfil</h4>
                 <div class="form-group">
                    <label for="bg-name">Nome do Fundo</label>
                    <input type="text" id="bg-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="bg-image-file">Ficheiro da Imagem de Fundo</label>
                    <input type="file" id="bg-image-file" class="form-control" accept="image/*" required>
                </div>
                <button type="submit" class="action-btn">Criar Fundo</button>
            </form>
        </div>

        <div class="admin-widget">
            <h2>Itens Existentes</h2>
            <div id="achievements-list-container" style="margin-bottom: 2rem;">
                <h3>🏆 Conquistas</h3>
                <div id="achievements-list"></div>
                <div id="achievements-list-pagination" class="pagination-controls"></div>
            </div>
            <div id="backgrounds-list-container">
                <h3>Fundos de Perfil</h3>
                <div id="backgrounds-list"></div>
                <div id="backgrounds-list-pagination" class="pagination-controls"></div>
            </div>
        </div>
        <style>
            .list-item-preview { display: flex; align-items: center; border-bottom: 1px solid #eee; padding: 10px; gap: 15px; }
            .preview-icon { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
            .item-actions { display: flex; gap: 5px; }
            /* Estilo para paginação (pode mover para admin.css) */
            .pagination-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
            .pagination-btn { padding: 8px 12px; background-color: var(--scout-blue); color: white; border: none; border-radius: 5px; cursor: pointer; }
            .pagination-btn:disabled { background-color: var(--text-secondary); cursor: not-allowed; }
            .pagination-info { font-size: 0.9rem; color: var(--text-secondary); }
            .editing-row { flex-direction: column; align-items: stretch; }
        </style>
    `;

    const itemSelector = viewElement.querySelector('#item-type-selector');
    const achievementForm = viewElement.querySelector('#create-achievement-form');
    const backgroundForm = viewElement.querySelector('#create-background-form');

    itemSelector.addEventListener('change', () => {
        achievementForm.style.display = itemSelector.value === 'achievement' ? 'block' : 'none';
        backgroundForm.style.display = itemSelector.value === 'background' ? 'block' : 'none';
    });
    
    // --- (Listener do formulário de CRIAÇÃO de conquista não muda) ---
    achievementForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        const iconFile = document.getElementById('ach-icon-file').files[0];
        if (!iconFile) { showToast('Por favor, selecione um ícone.', 'error'); return; }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('ach-name').value);
        formData.append('description', document.getElementById('ach-description').value);
        formData.append('xpReward', document.getElementById('ach-xp-reward').value);
        formData.append('rewardType', document.getElementById('ach-reward-type').value);
        formData.append('iconFile', iconFile);

        try {
            await fetchApi('/api/admin/achievements', { method: 'POST', body: formData });
            showToast('Conquista criada com sucesso!', 'success');
            achievementForm.reset();
            loadAndRenderAchievements(viewElement.querySelector("#achievements-list"), 0); // Recarrega
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Conquista';
        }
    });
    
    // --- (Listener do formulário de CRIAÇÃO de fundo não muda) ---
    backgroundForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        const imageFile = document.getElementById('bg-image-file').files[0];
        if (!imageFile) { showToast('Por favor, selecione uma imagem.', 'error'); return; }

        submitButton.disabled = true;
        submitButton.textContent = 'Criando...';

        const formData = new FormData();
        formData.append('name', document.getElementById('bg-name').value);
        formData.append('imageFile', imageFile);
        formData.append('textColor', '#FFFFFF'); // Cor padrão

        try {
            await fetchApi('/api/admin/backgrounds', { method: 'POST', body: formData });
            showToast('Fundo criado com sucesso!', 'success');
            backgroundForm.reset();
            loadAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"), 0); // Recarrega
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Criar Fundo';
        }
    });
    
    // ATUALIZADO: Carrega a primeira página de cada lista
    loadAndRenderAchievements(viewElement.querySelector("#achievements-list"), 0);
    loadAndRenderBackgrounds(viewElement.querySelector("#backgrounds-list"), 0);
}