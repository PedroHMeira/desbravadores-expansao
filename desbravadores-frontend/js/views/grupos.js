// js/views/grupos.js

import { escapeHtml } from '../utils/sanitize.js';

export async function renderGruposView(viewElement) {
    
    viewElement.innerHTML = `<div class="group-accordion-container" id="groupAccordion"><p>A carregar grupos...</p></div>`;
    const accordionContainer = viewElement.querySelector('#groupAccordion');
    if (!accordionContainer) return;
    
    try {
        // CORREÇÃO 1: A API agora retorna Page<T>. Chamamos com size grande para obter todos os grupos em uma única página.
        const groupPage = await fetchApi('/api/groups?page=0&size=999');

        // CORREÇÃO CRÍTICA: Extrai o array de grupos da propriedade '.content'
        const groupDetails = groupPage.content;

        if (groupDetails.length === 0) {
            accordionContainer.innerHTML = '<p>Nenhum grupo encontrado.</p>';
            return;
        }

        accordionContainer.innerHTML = ''; // Limpa a mensagem de carregamento

        groupDetails.forEach(detail => {
            const group = detail.group;
            const members = detail.members || []; // MemberDTOs
            const leader = group.leader; // O líder já vem como objeto User dentro do Group
            
            const leaderName = leader ? `${escapeHtml(leader.name)} ${escapeHtml(leader.surname)}` : 'Líder não definido';
            // Usa o avatar real do líder ou um padrão
            const leaderAvatar = leader ? (escapeHtml(leader.avatar) || 'img/escoteiro1.png') : 'img/escoteiro1.png';

            const cardElement = document.createElement('div');
            cardElement.className = 'group-card';
            
            // Usando gradiente padrão (pois a API não retorna o gradiente no objeto Group)
            const defaultGradient = 'linear-gradient(120deg, var(--scout-green) 0%, var(--scout-light-green) 100%)';
            const groupGradient = defaultGradient;
            
            cardElement.innerHTML = `
                <div class="group-card-header" style="background-image: ${groupGradient};">
                    <div class="group-info">
                        <div class="group-card-name">${escapeHtml(group.name)}</div>
                        <div class="group-card-details">${members.length} membro(s)</div>
                    </div>
                    <div class="group-leader-info">
                        <div class="leader-text">
                            <div class="leader-name">${leaderName}</div>
                            <div class="leader-title">${leader ? leader.role : 'Sem Função'}</div>
                        </div>
                        <img src="${leaderAvatar}" alt="Líder" class="leader-avatar">
                    </div>
                </div>
                <div class="group-members-panel">
                    <div class="members-list">
                        ${members.length > 0 ? members.map(member => `
                            <div class="member-item" data-user-id="${member.id}">
                                <img src="img/escoteiro1.png" alt="Avatar" class="avatar-img">
                                <div class="member-info">
                                    <div class="member-name">${escapeHtml(member.name)} ${escapeHtml(member.surname)}</div>
                                    <div class="member-rank">${member.role}</div>
                                </div>
                                <div class="profile-link-icon">→</div>
                            </div>
                        `).join('') : '<p style="padding: 1rem;">Este grupo não possui membros.</p>'}
                    </div>
                </div>
            `;
            
            accordionContainer.appendChild(cardElement);
        });

        // Adiciona listeners para abrir/fechar o accordion
        accordionContainer.querySelectorAll('.group-card-header').forEach(header => {
            header.addEventListener('click', () => {
                const panel = header.nextElementSibling;
                const card = header.parentElement;
                const isActive = card.classList.contains('active');

                // Fecha todos os outros
                accordionContainer.querySelectorAll('.group-card.active').forEach(activeCard => {
                    activeCard.classList.remove('active');
                    activeCard.querySelector('.group-members-panel').style.maxHeight = null;
                });

                if (!isActive) {
                    // Abre o selecionado
                    card.classList.add('active');
                    panel.style.maxHeight = panel.scrollHeight + "px"; 
                }
            });
        });

        // Adiciona listeners para navegar para o perfil do membro
        accordionContainer.querySelectorAll('.member-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = item.dataset.userId;
                const navigateEvent = new CustomEvent('navigate', {
                    detail: { view: 'perfil', data: userId }
                });
                window.dispatchEvent(navigateEvent);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar grupos:", error);
        accordionContainer.innerHTML = `<p style="color: red;">Não foi possível carregar os grupos: ${error.message}</p>`;
    }
}