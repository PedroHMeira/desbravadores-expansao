// js/views/admin/manage-achievements.js

import { escapeHtml } from '../../utils/sanitize.js';

export async function renderManageAchievementsView(viewElement, userId) {
    if (!userId) {
        viewElement.innerHTML = `<p>Erro: Nenhum utilizador selecionado.</p>`;
        return;
    }

    viewElement.innerHTML = `<p>A carregar dados de conquistas...</p>`;

    try {
        const [user, allAchievements] = await Promise.all([
            fetchApi(`/api/users/${userId}`),
            fetchApi('/api/gamification/achievements')
        ]);

        const userUnlockedAchievementNames = new Set(user.badges.map(b => b.name));

        viewElement.innerHTML = `
            <div class="admin-widget">
                <h2>Gerir Conquistas para: ${escapeHtml(user.name)} ${escapeHtml(user.surname)}</h2>
                <p>Clique em "Conceder" para desbloquear uma conquista para este usuário ou "Revogar" para removê-la.</p>
                
                <div class="achievements-management-list">
                    ${allAchievements.length > 0 ? allAchievements.map(achievement => {
                        const isUnlocked = userUnlockedAchievementNames.has(achievement.name);
                        return `
                        <div class="achievement-manage-item">
                            <img src="${window.API_BASE_URL}${achievement.icon}" alt="${escapeHtml(achievement.name)}" class="preview-icon">
                            <div class="achievement-info">
                                <h4>${escapeHtml(achievement.name)} (+${achievement.xpReward} XP)</h4>
                                <p>${escapeHtml(achievement.description)}</p>
                            </div>
                            <button class="action-btn-small ${isUnlocked ? 'revoke-btn' : 'grant-btn'}" 
                                    data-user-id="${userId}" 
                                    data-achievement-id="${achievement.id}">
                                ${isUnlocked ? 'Revogar' : 'Conceder'}
                            </button>
                        </div>
                    `}).join('') : '<p>Nenhuma conquista foi criada ainda. Crie uma na tela "Criar Item".</p>'}
                </div>
            </div>
            <style>
                .achievements-management-list { display: flex; flex-direction: column; gap: 1rem; }
                .achievement-manage-item { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; background: var(--bg-primary); padding: 1rem; border-radius: 8px; }
                .preview-icon { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
                .grant-btn { background-color: var(--scout-green); color: white; }
                .revoke-btn { background-color: #c62828; color: white; }
            </style>
        `;

        viewElement.querySelectorAll('.grant-btn, .revoke-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const uId = btn.dataset.userId;
                const achId = btn.dataset.achievementId;
                const isGranting = btn.classList.contains('grant-btn');
                
                btn.disabled = true;
                btn.textContent = 'Aguarde...';

                try {
                    const endpoint = `/api/admin/users/${uId}/achievements/${achId}`;
                    const method = isGranting ? 'POST' : 'DELETE';

                    const response = await fetchApi(endpoint, { method: method });
                    showToast(response.message, 'success');

                    // A magia acontece aqui: a função abaixo redesenha a tela,
                    // criando um novo botão já no estado correto.
                    renderManageAchievementsView(viewElement, userId);

                } catch (error) {
                    showToast(`Erro: ${error.message}`, 'error');
                    // Se der erro, reativamos o botão para que o utilizador possa tentar novamente
                    btn.disabled = false;
                    btn.textContent = isGranting ? 'Conceder' : 'Revogar';
                }
                // O bloco "finally" foi removido pois era a causa do problema.
            });
        });

    } catch (error) {
        viewElement.innerHTML = `<p style="color: red;">Erro ao carregar a página de gestão: ${error.message}</p>`;
    }
}