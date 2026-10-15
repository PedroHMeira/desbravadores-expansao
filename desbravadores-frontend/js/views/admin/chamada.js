// js/views/admin/chamada.js

// fetchApi e showToast estão disponíveis globalmente

import { escapeHtml } from '../../utils/sanitize.js';

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

const STATUS_LABELS = {
    PRESENTE: 'Presente',
    FALTA: 'Falta',
    FALTA_JUSTIFICADA: 'Justificada',
};

export async function renderChamadaView(viewElement) {
    const isDirector = getUserRole() === 'DIRETOR';
    const today = new Date().toISOString().split('T')[0];

    // state.statuses[userId] = null (não marcado) ou { status, justification, lenco, camisa, calca, tenis }
    const state = {
        groupId: null,
        members: [],
        statuses: {},
    };

    viewElement.innerHTML = `
        <div class="chamada-container">
            <div class="admin-widget">
                <h2>Chamada do Grupo</h2>

                ${isDirector ? `
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label for="chamada-group">Selecione o grupo:</label>
                        <select id="chamada-group" class="form-control">
                            <option value="">Selecione um grupo...</option>
                        </select>
                    </div>
                ` : ''}

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="chamada-date">Selecione a data da chamada:</label>
                    <input type="date" id="chamada-date" class="form-control" value="${today}" max="${today}">
                </div>

                <p id="chamada-loading-message">A carregar membros do grupo...</p>

                <div id="chamada-toolbar" class="chamada-toolbar" style="display: none;">
                    <span id="chamada-counter" class="chamada-counter"></span>
                    <button type="button" id="mark-all-present-btn" class="action-btn-secondary">Marcar todos presentes</button>
                </div>

                <div class="student-list" id="studentList"></div>
                <button id="submit-chamada-btn" class="action-btn" style="display: none; margin-top: 1.5rem;" disabled>Submeter Chamada</button>
            </div>
        </div>
    `;

    const groupSelect = viewElement.querySelector('#chamada-group');
    const dateInput = viewElement.querySelector('#chamada-date');
    const loadingMessage = viewElement.querySelector('#chamada-loading-message');
    const toolbar = viewElement.querySelector('#chamada-toolbar');
    const counterEl = viewElement.querySelector('#chamada-counter');
    const markAllBtn = viewElement.querySelector('#mark-all-present-btn');
    const studentListContainer = viewElement.querySelector('#studentList');
    const submitBtn = viewElement.querySelector('#submit-chamada-btn');

    function emptyAttendanceState() {
        return { status: null, justification: '', lenco: false, camisa: false, calca: false, tenis: false };
    }

    function renderCard(member) {
        const record = state.statuses[member.id] || emptyAttendanceState();
        const status = record.status;
        const statusClass = status ? `status-${status.toLowerCase()}` : 'status-unmarked';
        const photo = member.avatar || 'img/escoteiro1.png';

        return `
            <div class="student-card ${statusClass}" data-student-id="${member.id}">
                <img src="${escapeHtml(photo)}" alt="${escapeHtml(member.name)}" class="student-photo">
                <div class="student-body">
                    <div class="student-name">${escapeHtml(member.name)} ${escapeHtml(member.surname || '')}</div>
                    <div class="status-buttons">
                        ${Object.entries(STATUS_LABELS).map(([value, label]) => `
                            <button type="button" class="status-btn status-btn-${value.toLowerCase()} ${status === value ? 'active' : ''}" data-status="${value}">${label}</button>
                        `).join('')}
                    </div>
                    ${status === 'FALTA_JUSTIFICADA' ? `
                        <div class="justification-field">
                            <label>Motivo da falta *</label>
                            <textarea class="justification-input" rows="2" placeholder="Explique o motivo da falta...">${escapeHtml(record.justification || '')}</textarea>
                        </div>
                    ` : ''}
                    ${status === 'PRESENTE' ? `
                        <div class="uniform-checklist">
                            <label><input type="checkbox" data-uniform="lenco" ${record.lenco ? 'checked' : ''}> Lenço</label>
                            <label><input type="checkbox" data-uniform="camisa" ${record.camisa ? 'checked' : ''}> Camisa</label>
                            <label><input type="checkbox" data-uniform="calca" ${record.calca ? 'checked' : ''}> Calça</label>
                            <label><input type="checkbox" data-uniform="tenis" ${record.tenis ? 'checked' : ''}> Tênis</label>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function renderCardById(userId) {
        const card = studentListContainer.querySelector(`.student-card[data-student-id="${userId}"]`);
        const member = state.members.find(m => m.id === userId);
        if (!card || !member) return;
        card.outerHTML = renderCard(member);
    }

    function renderList() {
        studentListContainer.innerHTML = state.members.map(renderCard).join('');
    }

    function updateToolbar() {
        const total = state.members.length;
        const marked = state.members.filter(m => state.statuses[m.id]?.status).length;
        counterEl.textContent = `${marked} de ${total} marcados`;

        const allMarked = total > 0 && marked === total;
        const justificationsOk = state.members.every(m => {
            const record = state.statuses[m.id];
            if (!record || record.status !== 'FALTA_JUSTIFICADA') return true;
            return !!(record.justification && record.justification.trim());
        });
        submitBtn.disabled = !(allMarked && justificationsOk);
    }

    function setStatus(userId, newStatus) {
        const current = state.statuses[userId] || emptyAttendanceState();
        state.statuses[userId] = {
            ...current,
            status: newStatus,
            // Uniforme só se aplica quando PRESENTE; ao sair desse status, zera (o backend também força isso).
            lenco: newStatus === 'PRESENTE' ? current.lenco : false,
            camisa: newStatus === 'PRESENTE' ? current.camisa : false,
            calca: newStatus === 'PRESENTE' ? current.calca : false,
            tenis: newStatus === 'PRESENTE' ? current.tenis : false,
        };
        renderCardById(userId);
        updateToolbar();
    }

    studentListContainer.addEventListener('click', (e) => {
        const statusBtn = e.target.closest('.status-btn');
        if (!statusBtn) return;
        const card = e.target.closest('.student-card');
        const userId = parseInt(card.dataset.studentId, 10);
        setStatus(userId, statusBtn.dataset.status);
    });

    studentListContainer.addEventListener('input', (e) => {
        if (!e.target.matches('.justification-input')) return;
        const card = e.target.closest('.student-card');
        const userId = parseInt(card.dataset.studentId, 10);
        const record = state.statuses[userId] || emptyAttendanceState();
        record.justification = e.target.value;
        state.statuses[userId] = record;
        updateToolbar();
    });

    studentListContainer.addEventListener('change', (e) => {
        if (!e.target.matches('[data-uniform]')) return;
        const card = e.target.closest('.student-card');
        const userId = parseInt(card.dataset.studentId, 10);
        const record = state.statuses[userId] || emptyAttendanceState();
        record[e.target.dataset.uniform] = e.target.checked;
        state.statuses[userId] = record;
    });

    markAllBtn.addEventListener('click', () => {
        state.members.forEach(member => {
            state.statuses[member.id] = emptyAttendanceState();
            state.statuses[member.id].status = 'PRESENTE';
        });
        renderList();
        updateToolbar();
    });

    function groupQuery() {
        return isDirector && state.groupId ? `&groupId=${state.groupId}` : '';
    }

    async function loadDayData() {
        if (isDirector && !state.groupId) return;
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Reinicia o estado do dia antes de sobrepor o que já estiver salvo nessa data.
        state.statuses = {};
        state.members.forEach(member => { state.statuses[member.id] = emptyAttendanceState(); });

        try {
            const existing = await fetchApi(`/api/chamada/day?date=${selectedDate}${groupQuery()}`);
            existing.forEach(record => {
                if (state.statuses[record.userId]) {
                    state.statuses[record.userId] = {
                        status: record.status,
                        justification: record.justification || '',
                        lenco: record.lenco,
                        camisa: record.camisa,
                        calca: record.calca,
                        tenis: record.tenis,
                    };
                }
            });
        } catch (error) {
            showToast(`Erro ao carregar a chamada do dia: ${error.message}`, 'error');
        }

        renderList();
        updateToolbar();
    }

    async function loadMembers() {
        if (isDirector && !state.groupId) {
            loadingMessage.textContent = 'Selecione um grupo para começar.';
            loadingMessage.style.display = 'block';
            toolbar.style.display = 'none';
            submitBtn.style.display = 'none';
            studentListContainer.innerHTML = '';
            return;
        }

        loadingMessage.textContent = 'A carregar membros do grupo...';
        loadingMessage.style.display = 'block';
        toolbar.style.display = 'none';
        submitBtn.style.display = 'none';
        studentListContainer.innerHTML = '';

        try {
            const members = await fetchApi(`/api/chamada/members?${isDirector ? `groupId=${state.groupId}` : ''}`);
            state.members = members;

            if (members.length === 0) {
                loadingMessage.textContent = 'Este grupo ainda não tem desbravadores associados.';
                return;
            }

            loadingMessage.style.display = 'none';
            toolbar.style.display = 'flex';
            submitBtn.style.display = 'block';

            await loadDayData();
        } catch (error) {
            loadingMessage.style.color = 'red';
            loadingMessage.textContent = `Erro ao carregar dados: ${error.message}`;
        }
    }

    dateInput.addEventListener('change', loadDayData);

    if (isDirector) {
        try {
            const groupPage = await fetchApi('/api/groups?page=0&size=999');
            const groups = groupPage.content
                .map(detail => detail.group)
                .filter(group => group && group.id && group.name);

            groupSelect.innerHTML = '<option value="">Selecione um grupo...</option>' +
                groups.map(group => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join('');
        } catch (error) {
            showToast(`Erro ao carregar grupos: ${error.message}`, 'error');
        }

        groupSelect.addEventListener('change', () => {
            state.groupId = groupSelect.value || null;
            loadMembers();
        });

        loadingMessage.textContent = 'Selecione um grupo para começar.';
    } else {
        await loadMembers();
    }

    submitBtn.addEventListener('click', async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            showToast('Por favor, selecione uma data para a chamada.', 'error');
            return;
        }

        const records = state.members.map(member => {
            const record = state.statuses[member.id];
            return {
                userId: member.id,
                status: record.status,
                justification: record.status === 'FALTA_JUSTIFICADA' ? record.justification : null,
                lenco: record.status === 'PRESENTE' ? record.lenco : false,
                camisa: record.status === 'PRESENTE' ? record.camisa : false,
                calca: record.status === 'PRESENTE' ? record.calca : false,
                tenis: record.status === 'PRESENTE' ? record.tenis : false,
            };
        });

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'A submeter...';

            const payload = {
                date: selectedDate,
                groupId: isDirector ? state.groupId : undefined,
                records,
            };

            const response = await fetchApi('/api/chamada/submit', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            showToast(response.message || 'Chamada submetida com sucesso!', 'success');
        } catch (error) {
            showToast(`Erro ao submeter chamada: ${error.message}`, 'error');
        } finally {
            submitBtn.textContent = 'Submeter Chamada';
            updateToolbar();
        }
    });
}
