// js/views/agenda.js
import { showModal } from '../../components/modal.js';

// Estado local para controlar o calendário, independente do state.js
const agendaState = {
    currentMonth: new Date().getMonth(), // Mês atual (0-11)
    currentYear: new Date().getFullYear(),
    selectedDay: new Date().getDate(),
    activities: {} // Onde vamos armazenar as atividades do mês buscadas da API
};

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Função para buscar as atividades do mês na API
async function fetchActivitiesForMonth(year, month) {
    try {
        // A API espera o mês como 1-12, então adicionamos 1
        const taskPage = await fetchApi(`/api/tasks?year=${year}&month=${month + 1}&size=999`);
        const tasks = taskPage.content;
        
        // Organiza as tarefas por dia para fácil acesso
        const activitiesByDay = {};
        tasks.forEach(task => {
            // A data vem como 'YYYY-MM-DD', precisamos do dia
            const day = parseInt(task.date.split('-')[2], 10);
            if (!activitiesByDay[day]) {
                activitiesByDay[day] = [];
            }
            // Garante que o tempo é formatado antes de ser armazenado
            activitiesByDay[day].push(task);
        });
        agendaState.activities = activitiesByDay;

    } catch (error) {
        console.error("Erro ao buscar atividades:", error);
        agendaState.activities = {}; // Limpa as atividades em caso de erro
    } finally {
        // CORREÇÃO: Garante que o calendário e a timeline são renderizados SEMPRE após a busca da API
        renderCalendar();
        renderTimeline();
    }
}

function renderTimeline() {
    const { currentYear, currentMonth, selectedDay, activities } = agendaState;
    const timelineContainer = document.getElementById('timeline');
    const scheduleTitle = document.getElementById('scheduleTitle');
    if (!timelineContainer || !scheduleTitle) return;

    const date = new Date(currentYear, currentMonth, selectedDay);
    scheduleTitle.textContent = `${dayNames[date.getDay()]}, ${selectedDay} de ${monthNames[currentMonth]}`;

    const dayActivities = activities[selectedDay] || [];
    
    if (dayActivities.length === 0) {
        timelineContainer.innerHTML = `<p>Nenhuma atividade programada para este dia.</p>`;
        return;
    }

    // Garante que o tempo é cortado para HH:MM antes de ser exibido
    timelineContainer.innerHTML = dayActivities.map(act => `
        <div class="timeline-item">
            <div class="timeline-time">${act.time.substring(0, 5)}</div>
            <div class="timeline-content" data-title="${act.title}" data-description="${act.description || 'Sem descrição.'}">
                <div class="timeline-title">${act.title}</div>
            </div>
        </div>
    `).join('');
    
    timelineContainer.querySelectorAll('.timeline-content').forEach(item => {
        item.addEventListener('click', () => {
            showModal(item.dataset.title, item.dataset.description);
        });
    });
}

function renderCalendar() {
    const { currentYear, currentMonth, selectedDay, activities } = agendaState;
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('monthYear');
    if (!calendarGrid || !monthYearDisplay) return;

    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';

    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
        calendarGrid.innerHTML += `<div class="calendar-weekday">${day}</div>`;
    });

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.innerHTML += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const numActivities = activities[day]?.length || 0;
        if (numActivities > 0) {
            dayEl.innerHTML = `<span class="day-number">${day}</span><div class="activity-count-badge">${numActivities}</div>`;
        } else {
            dayEl.innerHTML = `<span class="day-number">${day}</span>`;
        }

        if (day === selectedDay) {
            dayEl.classList.add('selected');
        }

        dayEl.addEventListener('click', () => {
            agendaState.selectedDay = day;
            renderCalendar(); 
            renderTimeline();
        });

        calendarGrid.appendChild(dayEl);
    }
}

export function renderAgendaView(viewElement) {
    viewElement.innerHTML = `
        <div class="agenda-container">
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <button class="month-nav-arrow" id="prevMonthBtn">‹</button>
                    <h2 class="month-year" id="monthYear"></h2>
                    <button class="month-nav-arrow" id="nextMonthBtn">›</button>
                </div>
                <div class="calendar-grid" id="calendarGrid"></div>
            </div>
            <div class="schedule-wrapper">
                <div class="schedule-header">
                    <h2 class="schedule-title" id="scheduleTitle"></h2>
                </div>
                <div class="timeline" id="timeline"></div>
            </div>
        </div>
    `;

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        agendaState.currentMonth--;
        if (agendaState.currentMonth < 0) {
            agendaState.currentMonth = 11;
            agendaState.currentYear--;
        }
        // Reseta o dia selecionado para o primeiro dia do novo mês (ou mantém, se preferir)
        agendaState.selectedDay = 1; 
        fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        agendaState.currentMonth++;
        if (agendaState.currentMonth > 11) {
            agendaState.currentMonth = 0;
            agendaState.currentYear++;
        }
        // Reseta o dia selecionado
        agendaState.selectedDay = 1;
        fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
    });

    // Busca as atividades do mês atual ao carregar a view
    fetchActivitiesForMonth(agendaState.currentYear, agendaState.currentMonth);
}