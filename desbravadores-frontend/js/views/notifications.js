// js/views/notifications.js

import { escapeHtml } from '../utils/sanitize.js';

async function markAsRead(notificationId, viewElement) {
    try {
        await fetchApi(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
        // Re-renderiza a view para refletir a mudança de estado
        renderNotificationsView(viewElement); 
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        alert('Não foi possível atualizar a notificação.');
    }
}

export async function renderNotificationsView(viewElement) {
    viewElement.innerHTML = `<div class="notifications-container"><p>A carregar notificações...</p></div>`;

    try {
        const notifications = await fetchApi('/api/notifications');

        if (!notifications || notifications.length === 0) {
            viewElement.innerHTML = `
                <div class="notifications-container">
                    <h2>Notificações</h2>
                    <p>Você não tem nenhuma notificação ainda.</p>
                </div>
            `;
            return;
        }

        viewElement.innerHTML = `
            <div class="notifications-container">
                <h2>Notificações</h2>
                <div class="notification-list">
                    ${notifications.map(n => `
                        <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                            <div class="notification-icon">
                                ${n.read ? '✔️' : '🔔'}
                            </div>
                            <div class="notification-content">
                                <p>${escapeHtml(n.message)}</p>
                                <span class="notification-time">${new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Adiciona event listeners para marcar como lido
        viewElement.querySelectorAll('.notification-item.unread').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.id;
                markAsRead(notificationId, viewElement);
            });
        });

    } catch (error) {
        viewElement.innerHTML = `<div class="notifications-container"><p style="color: red;">Erro ao carregar notificações: ${error.message}</p></div>`;
    }
}