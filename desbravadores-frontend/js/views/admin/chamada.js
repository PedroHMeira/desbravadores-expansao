// js/views/admin/chamada.js

// A função fetchApi e showToast estarão disponíveis globalmente

import { escapeHtml } from '../../utils/sanitize.js';

export async function renderChamadaView(viewElement) {

    const today = new Date().toISOString().split('T')[0];

    viewElement.innerHTML = `
        <div class="chamada-container">
            <div class="admin-widget">
                <h2>Chamada do Grupo</h2>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="chamada-date">Selecione a data da chamada:</label>
                    <input type="date" id="chamada-date" class="form-control" value="${today}">
                </div>

                <p id="chamada-loading-message">A carregar membros do grupo...</p>
                <div class="student-list" id="studentList"></div>
                <button id="submit-chamada-btn" class="action-btn" style="display: none; margin-top: 1.5rem;">Submeter Chamada</button>
            </div>
        </div>
    `;

    const studentListContainer = viewElement.querySelector('#studentList');
    const loadingMessage = viewElement.querySelector('#chamada-loading-message');
    const submitBtn = viewElement.querySelector('#submit-chamada-btn');
    const dateInput = viewElement.querySelector('#chamada-date');

    try {
        const members = await fetchApi('/api/chamada/my-group-members');

        if (members.length === 0) {
            loadingMessage.textContent = 'O seu grupo ainda não tem desbravadores associados.';
            return;
        }

        loadingMessage.style.display = 'none';
        submitBtn.style.display = 'block';

        studentListContainer.innerHTML = members.map(student => `
            <div class="student-card" data-student-id="${student.id}">
                <img src="${escapeHtml(student.avatar) || 'img/escoteiro1.png'}" alt="${escapeHtml(student.name)}" class="student-photo">
                <div class="student-info">
                    <div class="student-name">${escapeHtml(student.name)} ${escapeHtml(student.surname)}</div>
                </div>
                <span class="check-icon">✔️</span>
            </div>
        `).join('');

        const presentUserIds = new Set();

        studentListContainer.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('present');
                const studentId = this.dataset.studentId;

                if (this.classList.contains('present')) {
                    presentUserIds.add(parseInt(studentId, 10));
                } else {
                    presentUserIds.delete(parseInt(studentId, 10));
                }
            });
        });

        submitBtn.addEventListener('click', async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                showToast('Por favor, selecione uma data para a chamada.', 'error'); // Usa showToast
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'A submeter...';

                const payload = {
                    date: selectedDate,
                    presentUserIds: Array.from(presentUserIds)
                };

                const response = await fetchApi('/api/chamada/submit', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                showToast(response.message || 'Chamada submetida com sucesso!', 'success'); // Usa showToast
                // Limpa a seleção visual e o set de IDs
                studentListContainer.querySelectorAll('.student-card.present').forEach(card => {
                    card.classList.remove('present');
                });
                presentUserIds.clear();

            } catch (error) {
                showToast(`Erro ao submeter chamada: ${error.message}`, 'error'); // Usa showToast
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submeter Chamada';
            }
        });

    } catch (error) {
        loadingMessage.style.color = 'red';
        loadingMessage.textContent = `Erro ao carregar dados: ${error.message}`;
    }
}