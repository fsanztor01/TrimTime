// js/controllers/adminController.js
import { DatabaseService } from '../services/databaseService.js';
import { translations } from '../services/translation.js';
import { generateId } from '../utils/constants.js';
import {
    formatDate,
    formatDateDisplay,
    formatDays,
} from '../utils/dateUtils.js';
import { showToast, showLoading } from '../utils/uiUtils.js';

export class AdminController {
    static setupEventListeners(state, elements) {
        console.log('Setting up admin controller event listeners...');

        // Tabs de Admin
        elements.adminTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                AdminController.showAdminTab(tab, state, elements);
            });
        });

        // Acciones Admin
        if (elements.addServiceBtn) {
            elements.addServiceBtn.addEventListener('click', () =>
                AdminController.showAddServiceModal(state, elements)
            );
        }

        if (elements.addBarberBtn) {
            elements.addBarberBtn.addEventListener('click', () =>
                AdminController.showAddBarberModal(state, elements)
            );
        }

        if (elements.filterAppointments) {
            elements.filterAppointments.addEventListener('click', AdminController.showFilterModal);
        }

        // Cerrar modales (botón X)
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Cerrar modal al hacer click fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Filtro de rango de fechas en Stats
        const applyDateBtn = document.getElementById('applyDateRange');
        if (applyDateBtn) {
            applyDateBtn.addEventListener('click', () => {
                AdminController.renderAdminStats(state, elements);
            });
        }

        // Exponer helpers globales para acciones desde HTML inline
        window.__redrawAdminCalendar = () => AdminController.renderAdminCalendar(state, elements);

        // Exponer funciones globales
        window.updateAppointmentStatus = async (id, newStatus) => {
            try {
                const res = await DatabaseService.updateAppointment(id, { status: newStatus });
                if (res.success) {
                    showToast('Appointment updated', 'success');

                    // Refresh ALL admin views immediately
                    AdminController.renderAdminAppointments(state, elements);
                    AdminController.renderAdminStats(state, elements);
                    if (typeof window.__redrawAdminCalendar === 'function') window.__redrawAdminCalendar();

                    // Close modal if open
                    const modal = document.getElementById('appointmentModal');
                    if (modal) {
                        modal.classList.remove('active');
                    }
                } else {
                    showToast(res.error || 'Error updating appointment', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Error updating appointment', 'error');
            }
        };

        window.deleteAppointment = async (ev, appointmentId, dateStr) => {
            try {
                const ok = confirm("¿Seguro que quieres eliminar esta cita? Se mantendrá en estadísticas.");
                if (!ok) return;

                const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
                const idx = appointments.findIndex(a => a.id === appointmentId);
                if (idx !== -1) {
                    appointments[idx] = { ...appointments[idx], deleted: true, updatedAt: new Date().toISOString() };
                    localStorage.setItem('appointments', JSON.stringify(appointments));
                }

                // Quitar tarjeta en UI (modal/lista)
                if (ev && ev.target) {
                    const card = ev.target.closest('[data-appointment-id]');
                    if (card && card.parentElement) {
                        card.parentElement.removeChild(card);
                    }
                } else {
                    document.querySelectorAll(`[data-appointment-id="${appointmentId}"]`).forEach(node => node.remove());
                }

                // Si ya no hay citas en el modal, indicar vacío
                const modalList = document.querySelector('#appointmentModalContent .appointments-list');
                if (modalList && modalList.children.length === 0) {
                    const container = document.getElementById('appointmentModalContent');
                    const lang = (window.__state?.currentLanguage) || state.currentLanguage || 'en';
                    if (container) {
                        container.innerHTML = `
                            <h2>${translations[lang]?.['calendar.selectDate'] || 'Appointments for'} ${formatDateDisplay(dateStr || '')}</h2>
                            <p>${translations[lang]?.['noAppointments'] || 'No appointments found'}</p>
                        `;
                    }
                }

                if (typeof window.__redrawAdminCalendar === 'function') {
                    window.__redrawAdminCalendar();
                }
                showToast("Cita eliminada (queda registrada en estadísticas)", "success");
            } catch (e) {
                console.error('Error deleting appointment', e);
                showToast("Error deleting appointment", "error");
            }
        };

        window.toggleServiceStatus = async (serviceId) => {
            try {
                const services = (await DatabaseService.getServices()).data || [];
                const sv = services.find(s => s.id === serviceId);
                if (!sv) return;
                const res = await DatabaseService.updateService(serviceId, { active: !sv.active });
                if (res.success) {
                    showToast('Service status updated', 'success');
                    AdminController.renderAdminServices(state, elements);
                } else {
                    showToast(res.error || 'Error updating service', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Error updating service', 'error');
            }
        };

        window.deleteService = async (serviceId) => {
            try {
                const ok = confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.');
                if (!ok) return;
                const res = await DatabaseService.deleteService(serviceId);
                if (res.success) {
                    showToast('Service deleted', 'success');
                    AdminController.renderAdminServices(state, elements);
                } else {
                    showToast(res.error || 'Error deleting service', 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Error deleting service', 'error');
            }
        };

        window.editService = async (serviceId) => {
            AdminController.showEditServiceModal(state, elements, serviceId);
        };
    }

    static showAdminTab(tab, state, elements) {
        elements.adminTabPanes.forEach(pane => pane.classList.remove('active'));
        const selectedTab = document.getElementById(`${tab}Tab`);
        if (selectedTab) selectedTab.classList.add('active');

        elements.adminTabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tab) btn.classList.add('active');
        });

        switch (tab) {
            case 'calendar':
                AdminController.renderAdminCalendar(state, elements);
                break;
            case 'appointments':
                AdminController.renderAdminAppointments(state, elements);
                break;
            case 'services':
                AdminController.renderAdminServices(state, elements);
                break;
            case 'barbers':
                AdminController.renderAdminBarbers(state, elements);
                break;
            case 'ratings':
                AdminController.renderAdminRatings(state, elements);
                break;
            case 'stats':
                AdminController.renderAdminStats(state, elements);
                break;
        }
    }
    // =============== CALENDARIO ===============
    static renderAdminCalendar(state, elements) {
        const container = document.getElementById('adminCalendar');
        if (!container) return;

        // Mes y año actuales
        const month = (typeof state.currentMonth === 'number') ? state.currentMonth : new Date().getMonth();
        const year = (typeof state.currentYear === 'number') ? state.currentYear : new Date().getFullYear();

        // Cabecera
        const monthsStr = translations[state.currentLanguage]?.['calendar.months']
            || 'January,February,March,April,May,June,July,August,September,October,November,December';
        const months = monthsStr.split(',');
        const monthName = months[month] || '';

        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
    <h3>${monthName} ${year}</h3>
    <div class="calendar-nav">
        <button class="btn btn-secondary" id="adminPrevMonth">◀</button>
        <button class="btn btn-secondary" id="adminNextMonth">▶</button>
    </div>
`;

        // Contenedor base
        container.innerHTML = '';
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        container.appendChild(grid);

        // Cabecera de días
        const daysStr = translations[state.currentLanguage]?.['calendar.days'] || 'Sun,Mon,Tue,Wed,Thu,Fri,Sat';
        const dayHeaders = daysStr.split(',');
        dayHeaders.forEach(day => {
            const el = document.createElement('div');
            el.className = 'calendar-day-header';
            el.textContent = day;
            grid.appendChild(el);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Espacios vacíos del primer día
        for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

        const isSameDate = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        // Cargar citas
        DatabaseService.getAppointments().then(result => {
            if (!result.success) return;
            const appointments = result.data.filter(a => !a.deleted);

            // Colores por estado
            const COLORS = {
                completed: '#0d6efd', // Azul
                confirmed: '#28a745', // Verde
                pending: '#ffc107',   // Amarillo
                canceled: '#dc3545'   // Rojo
            };

            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = 'calendar-day';

                // Responsive styling based on screen size
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    cell.style.minHeight = '50px';
                    cell.style.padding = '2px';
                } else {
                    cell.style.minHeight = '80px';
                    cell.style.padding = '6px 4px';
                }

                cell.style.display = 'flex';
                cell.style.flexDirection = 'column';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'flex-start';
                cell.style.textAlign = 'center';

                // Número del día
                const numberEl = document.createElement('div');
                numberEl.className = 'day-number';
                numberEl.textContent = day;
                numberEl.style.fontWeight = '700';
                numberEl.style.fontSize = isMobile ? '12px' : '16px';
                numberEl.style.marginBottom = isMobile ? '2px' : '6px';
                cell.appendChild(numberEl);

                // Contenedor de círculos
                const indicators = document.createElement('div');
                indicators.className = 'day-indicators';
                indicators.style.display = 'flex';
                indicators.style.gap = isMobile ? '2px' : '4px';
                indicators.style.flexWrap = 'wrap';
                indicators.style.justifyContent = 'center';
                indicators.style.alignItems = 'center';
                cell.appendChild(indicators);

                const date = new Date(year, month, day);
                const dateStr = formatDate(date);
                const dow = date.getDay();

                // Hoy
                if (isSameDate(date, new Date())) {
                    cell.classList.add('today');
                    cell.title = 'Hoy';
                }

                // Domingo cerrado
                if (dow === 0) {
                    cell.classList.add('disabled');
                    cell.title = 'Domingo - Cerrado';
                }

                // Citas del día
                const dayAppointments = appointments.filter(a => a.date === dateStr);
                if (dayAppointments.length > 0) {
                    // Contar por estado
                    const counts = { completed: 0, confirmed: 0, pending: 0, canceled: 0 };
                    dayAppointments.forEach(a => {
                        if (counts[a.status] !== undefined) counts[a.status]++;
                    });

                    // Crear hasta 4 círculos, uno por tipo
                    Object.entries(counts).forEach(([status, count]) => {
                        if (count > 0) {
                            const badge = document.createElement('div');
                            badge.className = 'status-circle';
                            badge.style.minWidth = isMobile ? '12px' : '20px';
                            badge.style.height = isMobile ? '12px' : '20px';
                            badge.style.borderRadius = '50%';
                            badge.style.display = 'flex';
                            badge.style.alignItems = 'center';
                            badge.style.justifyContent = 'center';
                            badge.style.fontSize = isMobile ? '8px' : '11px';
                            badge.style.fontWeight = '700';
                            badge.style.color = '#fff';
                            badge.style.backgroundColor = COLORS[status];
                            badge.textContent = count;
                            indicators.appendChild(badge);
                        }
                    });

                    // Click: mostrar citas del día
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => {
                        AdminController.showDayAppointments(dateStr, state);
                    });

                    // Hover dorado
                    cell.addEventListener('mouseenter', () => {
                        cell.style.boxShadow = 'inset 0 0 0 2px rgba(212,175,55,0.25)';
                    });
                    cell.addEventListener('mouseleave', () => {
                        cell.style.boxShadow = 'none';
                    });
                }

                grid.appendChild(cell);
            }
        });

        // Navegación
        document.getElementById('adminPrevMonth')?.addEventListener('click', () => {
            state.currentMonth = (month === 0) ? 11 : month - 1;
            state.currentYear = (month === 0) ? year - 1 : year;
            AdminController.renderAdminCalendar(state, elements);
        });

        document.getElementById('adminNextMonth')?.addEventListener('click', () => {
            state.currentMonth = (month === 11) ? 0 : month + 1;
            state.currentYear = (month === 11) ? year + 1 : year;
            AdminController.renderAdminCalendar(state, elements);
        });
    }

    // Function to refresh calendar when appointments change
    static refreshAdminCalendar(state, elements) {
        console.log('Refreshing admin calendar...');
        AdminController.renderAdminCalendar(state, elements);
    }



    static async showDayAppointments(dateStr, state) {
        const appointmentsResult = await DatabaseService.getAppointments();
        const servicesResult = await DatabaseService.getServices(true);
        const barbersResult = await DatabaseService.getBarbers(true);
        const usersResult = await DatabaseService.getUsers();

        if (appointmentsResult.success && servicesResult.success && barbersResult.success && usersResult.success) {
            const appointments = appointmentsResult.data.filter(a => a.date === dateStr && !a.deleted);
            const services = servicesResult.data;
            const barbers = barbersResult.data;
            const users = usersResult.data;

            const modal = document.getElementById('appointmentModal');
            const content = document.getElementById('appointmentModalContent');
            if (!modal || !content) return;

            if (appointments.length === 0) {
                content.innerHTML = `
                    <h2>${translations[state.currentLanguage]['calendar.selectDate'] || 'Appointments for'} ${formatDateDisplay(dateStr)}</h2>
                    <p>${translations[state.currentLanguage]['noAppointments'] || 'No appointments found'}</p>
                `;
                modal.classList.add('active');
                return;
            }

            content.innerHTML = `
                <h2>${translations[state.currentLanguage]['calendar.selectDate'] || 'Appointments for'} ${formatDateDisplay(dateStr)}</h2>
                <div class="appointments-list">
                    ${appointments.map(appointment => {
                const service = services.find(s => s.id === appointment.service_id);
                const barber = barbers.find(b => b.id === appointment.employee_id);
                const client = users.find(u => u.id === appointment.client_id);

                const trashBtn = `
                            <button
                                class="btn"
                                title="${translations[state.currentLanguage]['admin.delete'] || 'Delete'}"
                                onclick="deleteAppointment(event, '${appointment.id}', '${dateStr}')"
                                style="background:none;border:none;font-size:.95rem;color:#9ca3af;padding:.25rem .35rem;border-radius:6px;box-shadow:none"
                                aria-label="Delete appointment"
                            >🗑️</button>`;

                return `
                            <div class="appointment-card" data-appointment-id="${appointment.id}">
                                <div class="appointment-header" style="display:flex;align-items:center;gap:.5rem;justify-content:space-between;">
                                    <h3 style="margin-right:auto">${service?.name || 'Service'}</h3>
                                    <span class="appointment-status status-${appointment.status}">
                                        ${translations[state.currentLanguage][`status.${appointment.status}`] || appointment.status}
                                    </span>
                                    ${(appointment.status === 'completed' || appointment.status === 'canceled') ? trashBtn : ''}
                                </div>
                                <div class="appointment-details">
                                    <div>🕐 ${appointment.time}</div>
                                    <div>👤 ${client?.name || 'Unknown'}</div>
                                    <div>✂️ ${barber?.name || 'Unknown'}</div>
                                    <div>⏱️ ${service?.duration || 0} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</div>
                                    <div>💰 $${service?.price || 0}</div>
                                </div>
                                <div class="appointment-actions">
                                    ${appointment.status === 'pending'
                        ? `<button class="btn btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'confirmed')">${translations[state.currentLanguage]['admin.confirm'] || 'Confirm'}</button>` : ''}
                                    ${appointment.status === 'confirmed'
                        ? `<button class="btn btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'completed')">${translations[state.currentLanguage]['admin.complete'] || 'Complete'}</button>` : ''}
                                    ${(appointment.status !== 'canceled' && appointment.status !== 'completed')
                        ? `<button class="btn btn-danger" onclick="updateAppointmentStatus('${appointment.id}', 'canceled')">${translations[state.currentLanguage]['admin.cancel'] || 'Cancel'}</button>` : ''}
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

            modal.classList.add('active');
        }
    }

    // =============== CITAS (LISTADO) ===============
    static async renderAdminAppointments(state, elements) {
        showLoading(true);

        try {
            const appointmentsResult = await DatabaseService.getAppointments();
            const servicesResult = await DatabaseService.getServices(true);
            const barbersResult = await DatabaseService.getBarbers(true);
            const usersResult = await DatabaseService.getUsers();

            if (appointmentsResult.success && servicesResult.success && barbersResult.success && usersResult.success) {
                const appointments = appointmentsResult.data.filter(a => !a.deleted);
                const services = servicesResult.data;
                const barbers = barbersResult.data;
                const users = usersResult.data;

                const container = document.getElementById('appointmentsList');
                if (!container) return;

                container.innerHTML = '';

                if (appointments.length === 0) {
                    container.innerHTML = `<p>${translations[state.currentLanguage]['noAppointments'] || 'No appointments found'}</p>`;
                    showLoading(false);
                    return;
                }

                appointments.sort((a, b) => {
                    const dateA = new Date(`${a.date} ${a.time}`);
                    const dateB = new Date(`${b.date} ${b.time}`);
                    return dateB - dateA;
                });

                appointments.forEach(appointment => {
                    const service = services.find(s => s.id === appointment.service_id);
                    const barber = barbers.find(b => b.id === appointment.employee_id);
                    const client = users.find(u => u.id === appointment.client_id);

                    const canTrash = (appointment.status === 'completed' || appointment.status === 'canceled');
                    const trashBtn = canTrash
                        ? `<button
                                class="btn"
                                title="${translations[state.currentLanguage]['admin.delete'] || 'Delete'}"
                                onclick="deleteAppointment(event, '${appointment.id}', '${appointment.date}')"
                                style="background:none;border:none;font-size:.95rem;color:#9ca3af;padding:.25rem .35rem;border-radius:6px;box-shadow:none"
                                aria-label="Delete appointment"
                           >🗑️</button>`
                        : '';

                    const card = document.createElement('div');
                    card.className = 'admin-card';
                    card.setAttribute('data-appointment-id', appointment.id);
                    card.innerHTML = `
                        <div class="admin-card-header" style="display:flex;align-items:center;gap:.5rem;">
                            <h3 style="margin-right:auto">${service?.name || 'Service'}</h3>
                            <span class="appointment-status status-${appointment.status}">
                                ${translations[state.currentLanguage][`status.${appointment.status}`] || appointment.status}
                            </span>
                            ${trashBtn}
                        </div>
                        <div class="appointment-details">
                            <div>📅 ${formatDateDisplay(appointment.date)}</div>
                            <div>🕐 ${appointment.time}</div>
                            <div>👤 ${client?.name || 'Unknown'}</div>
                            <div>✂️ ${barber?.name || 'Unknown'}</div>
                            <div>⏱️ ${service?.duration || 0} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</div>
                            <div>💰 $${service?.price || 0}</div>
                        </div>
                        <div class="admin-card-actions">
                            ${appointment.status === 'pending'
                            ? `<button class="btn btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'confirmed')">${translations[state.currentLanguage]['admin.confirm'] || 'Confirm'}</button>` : ''}
                            ${appointment.status === 'confirmed'
                            ? `<button class="btn btn-primary" onclick="updateAppointmentStatus('${appointment.id}', 'completed')">${translations[state.currentLanguage]['admin.complete'] || 'Complete'}</button>` : ''}
                            ${(appointment.status !== 'canceled' && appointment.status !== 'completed')
                            ? `<button class="btn btn-danger" onclick="updateAppointmentStatus('${appointment.id}', 'canceled')">${translations[state.currentLanguage]['admin.cancel'] || 'Cancel'}</button>` : ''}
                        </div>
                    `;

                    container.appendChild(card);
                });
            } else {
                showToast('Error loading appointments', 'error');
            }
        } catch (error) {
            console.error("Error rendering admin appointments:", error);
            showToast('Error loading appointments', 'error');
        } finally {
            showLoading(false);
        }
    }
    // =============== SERVICIOS (LISTADO) ===============
    static async renderAdminServices(state, elements) {
        showLoading(true);

        try {
            const result = await DatabaseService.getServices();
            const container = document.getElementById('servicesManagement');
            if (!container) return;

            container.innerHTML = '';

            if (result.success) {
                const services = result.data;

                if (services.length === 0) {
                    container.innerHTML = '<p>No services found</p>';
                    showLoading(false);
                    return;
                }

                services.forEach(service => {
                    // Código corregido
                    const name = service.nameEs && service.nameEn
                        ? (state.currentLanguage === 'es' ? service.nameEs : service.nameEn)
                        : service.name;
                    const desc = service.descEs && service.descEn
                        ? (state.currentLanguage === 'es' ? service.descEs : service.descEn)
                        : service.desc;

                    const card = document.createElement('div');
                    card.className = 'admin-card';
                    card.innerHTML = `
                        <div class="admin-card-header">
                            <h3>${name}</h3>
                            <span class="appointment-status ${service.active ? 'status-confirmed' : 'status-canceled'}">
                                ${service.active
                            ? translations[state.currentLanguage]['admin.active'] || 'Active'
                            : translations[state.currentLanguage]['admin.inactive'] || 'Inactive'}
                            </span>
                        </div>
                        <div class="appointment-details">
                            <div>⏱️ ${service.duration} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</div>
                            <div>💰 $${service.price}</div>
                            <div>${desc}</div>
                        </div>
                        <div class="admin-card-actions">
                            <button class="btn btn-secondary" onclick="editService('${service.id}')">
                                ${translations[state.currentLanguage]['admin.edit'] || 'Edit'}
                            </button>
                            <button class="btn btn-secondary" onclick="toggleServiceStatus('${service.id}')">
                                ${service.active
                            ? translations[state.currentLanguage]['admin.deactivate'] || 'Deactivate'
                            : translations[state.currentLanguage]['admin.activate'] || 'Activate'}
                            </button>
                            <button class="btn" title="${translations[state.currentLanguage]['admin.delete'] || 'Delete'}"
                                onclick="deleteService('${service.id}')"
                                style="background:none;border:1px solid var(--border-color);font-size:.90rem;color:#9ca3af;padding:.2rem .45rem;border-radius:6px;">
                                🗑️
                            </button>
                        </div>
                    `;

                    container.appendChild(card);
                });
            } else {
                showToast('Error loading services', 'error');
            }
        } catch (error) {
            console.error("Error rendering admin services:", error);
            showToast('Error loading services', 'error');
        } finally {
            showLoading(false);
        }
    }

    // =============== SERVICIOS (MODAL NUEVO) ===============
    // =============== SERVICIOS (MODAL NUEVO) ===============
    static showAddServiceModal(state, elements) {
        const modal = document.getElementById('serviceModal');
        const content = document.getElementById('serviceModalContent');

        if (!modal || !content) return;

        content.innerHTML = `
        <h2>Add New Service</h2>
        <form id="addServiceForm">
            <div class="form-group">
                <label for="serviceNameEn">Service Name (EN)</label>
                <input type="text" id="serviceNameEn" required>
            </div>
            <div class="form-group">
                <label for="serviceNameEs">Nombre del Servicio (ES)</label>
                <input type="text" id="serviceNameEs" required>
            </div>
            <div class="form-group">
                <label for="serviceDuration">Duration (minutes)</label>
                <input type="number" id="serviceDuration" min="5" step="5" required>
            </div>
            <div class="form-group">
                <label for="servicePrice">Price ($)</label>
                <input type="number" id="servicePrice" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="serviceDescEn">Description (EN)</label>
                <textarea id="serviceDescEn" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label for="serviceDescEs">Descripción (ES)</label>
                <textarea id="serviceDescEs" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="serviceActive" checked>
                    <span>Active</span>
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Add Service</button>
        </form>
    `;

        modal.classList.add('active');

        // 🔥 PARTE IMPORTANTE: AÑADE ESTE EVENT LISTENER
        document.getElementById('addServiceForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const idForImg = generateId();

            // 🔥 AQUÍ SE GUARDAN TODOS LOS CAMPOS DE TRADUCCIÓN
            const newService = {
                id: generateId(),
                nameEn: document.getElementById('serviceNameEn').value.trim(),
                nameEs: document.getElementById('serviceNameEs').value.trim(),
                name: state.currentLanguage === 'es'
                    ? document.getElementById('serviceNameEs').value.trim()
                    : document.getElementById('serviceNameEn').value.trim(),
                duration: parseInt(document.getElementById('serviceDuration').value, 10),
                price: parseFloat(document.getElementById('servicePrice').value),
                descEn: document.getElementById('serviceDescEn').value.trim(),
                descEs: document.getElementById('serviceDescEs').value.trim(),
                desc: state.currentLanguage === 'es'
                    ? document.getElementById('serviceDescEs').value.trim()
                    : document.getElementById('serviceDescEn').value.trim(),
                img: `https://picsum.photos/seed/${idForImg}/300/200.jpg`,
                active: document.getElementById('serviceActive').checked
            };

            try {
                const result = await DatabaseService.saveService(newService);
                if (result.success) {
                    showToast(translations[state.currentLanguage]['serviceAdded'] || 'Service added successfully', 'success');
                    modal.classList.remove('active');
                    AdminController.renderAdminServices(state, elements);
                } else {
                    showToast('Error adding service', 'error');
                }
            } catch (error) {
                console.error("Error adding service:", error);
                showToast('Error adding service', 'error');
            }
        });
    }

    // =============== SERVICIOS (MODAL EDITAR) ===============
    static async showEditServiceModal(state, elements, serviceId) {
        const modal = document.getElementById('serviceModal');
        const content = document.getElementById('serviceModalContent');
        if (!modal || !content) return;

        try {
            const { data: services } = await DatabaseService.getServices();
            const service = services.find(s => s.id === serviceId);
            if (!service) {
                showToast('Service not found', 'error');
                return;
            }

            const nameEn = service.nameEn || service.name || '';
            const nameEs = service.nameEs || service.name || '';
            const descEn = service.descEn || service.desc || '';
            const descEs = service.descEs || service.desc || '';

            content.innerHTML = `
                <h2>${translations[state.currentLanguage]['admin.edit'] || 'Edit'} Service</h2>
                <form id="editServiceForm">
                    <div class="form-group">
                        <label for="editServiceNameEn">Service Name (EN)</label>
                        <input type="text" id="editServiceNameEn" value="${nameEn.replace(/"/g, '&quot;')}" required>
                    </div>
                    <div class="form-group">
                        <label for="editServiceNameEs">Nombre del Servicio (ES)</label>
                        <input type="text" id="editServiceNameEs" value="${nameEs.replace(/"/g, '&quot;')}" required>
                    </div>
                    <div class="form-group">
                        <label for="editServiceDuration">Duration (minutes)</label>
                        <input type="number" id="editServiceDuration" min="5" step="5" value="${service.duration}" required>
                    </div>
                    <div class="form-group">
                        <label for="editServicePrice">Price ($)</label>
                        <input type="number" id="editServicePrice" min="0" step="0.01" value="${service.price}" required>
                    </div>
                    <div class="form-group">
                        <label for="editServiceDescEn">Description (EN)</label>
                        <textarea id="editServiceDescEn" rows="3" required>${descEn}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="editServiceDescEs">Descripción (ES)</label>
                        <textarea id="editServiceDescEs" rows="3" required>${descEs}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="editServiceActive" ${service.active ? 'checked' : ''}>
                            <span>Active</span>
                        </label>
                    </div>
                    <button type="submit" class="btn btn-primary">${translations[state.currentLanguage]['admin.save'] || 'Save'}</button>
                </form>
            `;

            modal.classList.add('active');

            document.getElementById('editServiceForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    nameEn: document.getElementById('editServiceNameEn').value.trim(),
                    nameEs: document.getElementById('editServiceNameEs').value.trim(),
                    duration: parseInt(document.getElementById('editServiceDuration').value, 10),
                    price: parseFloat(document.getElementById('editServicePrice').value),
                    descEn: document.getElementById('editServiceDescEn').value.trim(),
                    descEs: document.getElementById('editServiceDescEs').value.trim(),
                    // name/desc visibles dependen del idioma actual:
                    name: state.currentLanguage === 'es'
                        ? document.getElementById('editServiceNameEs').value.trim()
                        : document.getElementById('editServiceNameEn').value.trim(),
                    desc: state.currentLanguage === 'es'
                        ? document.getElementById('editServiceDescEs').value.trim()
                        : document.getElementById('editServiceDescEn').value.trim(),
                    active: document.getElementById('editServiceActive').checked
                };

                try {
                    const res = await DatabaseService.updateService(serviceId, payload);
                    if (res.success) {
                        showToast('Service updated', 'success');
                        modal.classList.remove('active');
                        AdminController.renderAdminServices(state, elements);
                    } else {
                        showToast(res.error || 'Error updating', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Error updating service', 'error');
                }
            });
        } catch (e) {
            console.error(e);
            showToast('Error opening edit modal', 'error');
        }
    }
    // =============== BARBEROS (LISTADO) ===============
    static async renderAdminBarbers(state, elements) {
        showLoading(true);

        try {
            const result = await DatabaseService.getBarbers();
            const container = document.getElementById('barbersManagement');
            if (!container) return;

            container.innerHTML = '';

            if (result.success) {
                const barbers = result.data;

                if (barbers.length === 0) {
                    container.innerHTML = '<p>No barbers found</p>';
                    showLoading(false);
                    return;
                }

                barbers.forEach(barber => {
                    const card = document.createElement('div');
                    card.className = 'admin-card';
                    card.innerHTML = `
                        <div class="admin-card-header">
                            <h3>${barber.name}</h3>
                            <span class="appointment-status ${barber.active ? 'status-confirmed' : 'status-canceled'}">
                                ${barber.active
                            ? translations[state.currentLanguage]['admin.active'] || 'Active'
                            : translations[state.currentLanguage]['admin.inactive'] || 'Inactive'}
                            </span>
                        </div>
                        <div class="appointment-details">
                            <div>📅 ${translations[state.currentLanguage]['admin.workingDays'] || 'Days'}: ${formatDays(barber.days)}</div>
                            <div>🕐 ${translations[state.currentLanguage]['admin.workingHours'] || 'Hours'}: ${barber.hours}</div>
                            <div>⭐ Rating: ${barber.rating || 'N/A'}</div>
                        </div>
                        <div class="admin-card-actions">
                            <button class="btn btn-secondary" onclick="editBarber('${barber.id}')">
                                ${translations[state.currentLanguage]['admin.edit'] || 'Edit'}
                            </button>
                            <button class="btn btn-secondary" onclick="toggleBarberStatus('${barber.id}')">
                                ${barber.active
                            ? translations[state.currentLanguage]['admin.deactivate'] || 'Deactivate'
                            : translations[state.currentLanguage]['admin.activate'] || 'Activate'}
                            </button>
                        </div>
                    `;
                    container.appendChild(card);
                });
            } else {
                showToast('Error loading barbers', 'error');
            }
        } catch (error) {
            console.error("Error rendering admin barbers:", error);
            showToast('Error loading barbers', 'error');
        } finally {
            showLoading(false);
        }
    }

    // =============== ESTADÍSTICAS ===============
    static async renderAdminStats(state, elements) {
        showLoading(true);

        try {
            // Por defecto: mes completo actual
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            const dateFrom = document.getElementById('statsDateFrom')?.value;
            const dateTo = document.getElementById('statsDateTo')?.value;

            const result = await DatabaseService.getStatistics({
                from: dateFrom || firstDayOfMonth,
                to: dateTo || lastDayOfMonth
            });

            if (result.success) {
                const stats = result.data;

                const totalAppointmentsEl = document.getElementById('totalAppointmentsCount');
                const confirmedAppointmentsEl = document.getElementById('confirmedAppointmentsCount');
                const completedAppointmentsEl = document.getElementById('completedAppointmentsCount');
                const cancellationsEl = document.getElementById('cancellationsCount');
                const cancellationRateEl = document.getElementById('cancellationRate');
                const totalRevenueEl = document.getElementById('totalRevenue');

                if (totalAppointmentsEl) totalAppointmentsEl.textContent = stats.totalAppointments;
                if (confirmedAppointmentsEl) confirmedAppointmentsEl.textContent = stats.confirmedAppointments;
                if (completedAppointmentsEl) completedAppointmentsEl.textContent = stats.completedAppointments;
                if (cancellationsEl) cancellationsEl.textContent = stats.canceledAppointments;
                if (cancellationRateEl) cancellationRateEl.textContent = `${stats.cancellationRate}%`;
                if (totalRevenueEl) totalRevenueEl.textContent = `$${stats.totalRevenue.toFixed(2)}`;

                // Top servicios
                const topServicesList = document.getElementById('topServicesList');
                if (topServicesList) {
                    topServicesList.innerHTML = '';
                    if (stats.topServices.length > 0) {
                        const servicesResult = await DatabaseService.getServices(true);
                        if (servicesResult.success) {
                            const services = servicesResult.data;
                            stats.topServices.forEach(({ serviceId, count }) => {
                                const service = services.find(s => s.id === serviceId);
                                if (service) {
                                    const li = document.createElement('li');
                                    const name = state.currentLanguage === 'es'
                                        ? (service.nameEs || service.name)
                                        : (service.nameEn || service.name);
                                    li.innerHTML = `<span>${name}</span><span>${count}</span>`;
                                    topServicesList.appendChild(li);
                                }
                            });
                        }
                    }
                }

                // Horas pico
                const peakHoursList = document.getElementById('peakHoursList');
                if (peakHoursList) {
                    peakHoursList.innerHTML = '';
                    stats.peakHours.forEach(({ hour, count }) => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span>${hour}:00</span><span>${count}</span>`;
                        peakHoursList.appendChild(li);
                    });
                }
            } else {
                showToast('Error loading statistics', 'error');
            }
        } catch (error) {
            console.error("Error rendering admin statistics:", error);
            showToast('Error loading statistics', 'error');
        } finally {
            showLoading(false);
        }
    }

    // =============== BARBEROS (MODAL NUEVO) ===============
    static showAddBarberModal(state, elements) {
        const modal = document.getElementById('barberModal');
        const content = document.getElementById('barberModalContent');

        if (!modal || !content) return;

        content.innerHTML = `
            <h2>Add New Barber</h2>
            <form id="addBarberForm">
                <div class="form-group">
                    <label for="barberName">Barber Name</label>
                    <input type="text" id="barberName" required>
                </div>
                <div class="form-group">
                    <label for="barberDays">Working Days (1-7, where 1=Monday)</label>
                    <input type="text" id="barberDays" placeholder="e.g., 1-5" required>
                </div>
                <div class="form-group">
                    <label for="barberHours">Working Hours (e.g., 09:00-17:00)</label>
                    <input type="text" id="barberHours" required>
                </div>
                <div class="form-group">
                    <label for="barberRating">Rating (0-5)</label>
                    <input type="number" id="barberRating" min="0" max="5" step="0.1" value="4.5" required>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="barberActive" checked>
                        <span>Active</span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary">Add Barber</button>
            </form>
        `;

        modal.classList.add('active');

        document.getElementById('addBarberForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const idForImg = generateId();
            const newBarber = {
                id: generateId(),
                name: document.getElementById('barberName').value.trim(),
                days: document.getElementById('barberDays').value.trim(),
                hours: document.getElementById('barberHours').value.trim(),
                rating: parseFloat(document.getElementById('barberRating').value),
                photo: `https://picsum.photos/seed/${idForImg}/200/200.jpg`,
                active: document.getElementById('barberActive').checked
            };

            try {
                const result = await DatabaseService.saveBarber(newBarber);

                if (result.success) {
                    showToast(translations[state.currentLanguage]['barberAdded'] || 'Barber added successfully', 'success');
                    modal.classList.remove('active');
                    AdminController.renderAdminBarbers(state, elements);
                    if (window.renderBarbers) {
                        window.renderBarbers();
                    }
                } else {
                    showToast('Error adding barber', 'error');
                }
            } catch (error) {
                console.error("Error adding barber:", error);
                showToast('Error adding barber', 'error');
            }
        });
    }

    static showFilterModal() {
        showToast('Filter functionality not implemented in this demo', 'warning');
    }

    // =============== RATINGS ===============
    // =============== RATINGS ===============
    static async renderAdminRatings(state, elements) {
        console.log('Rendering admin ratings...');
        showLoading(true);

        try {
            const ratingsResult = await DatabaseService.getAllRatings();
            console.log('Ratings result:', ratingsResult);

            const appointmentsResult = await DatabaseService.getAppointments();
            const barbersResult = await DatabaseService.getBarbers();
            const usersResult = await DatabaseService.getUsers();
            const servicesResult = await DatabaseService.getServices(); // 🔥 AÑADIR ESTO

            console.log('Appointments result:', appointmentsResult);
            console.log('Barbers result:', barbersResult);
            console.log('Users result:', usersResult);
            console.log('Services result:', servicesResult); // 🔥 AÑADIR ESTO

            if (ratingsResult.length > 0 && appointmentsResult.success && barbersResult.success && usersResult.success && servicesResult.success) {
                const appointments = appointmentsResult.data;
                const barbers = barbersResult.data;
                const users = usersResult.data;
                const services = servicesResult.data; // 🔥 AÑADIR ESTO

                console.log('Found ratings:', ratingsResult.length);
                console.log('Found appointments:', appointments.length);
                console.log('Found barbers:', barbers.length);
                console.log('Found users:', users.length);
                console.log('Found services:', services.length); // 🔥 AÑADIR ESTO

                // Calculate average ratings
                const barberRatings = ratingsResult.map(r => r.barberRating);
                const appRatings = ratingsResult.map(r => r.appRating);

                const avgBarberRating = barberRatings.length > 0
                    ? (barberRatings.reduce((sum, rating) => sum + rating, 0) / barberRatings.length).toFixed(1)
                    : '0.0';

                const avgAppRating = appRatings.length > 0
                    ? (appRatings.reduce((sum, rating) => sum + rating, 0) / appRatings.length).toFixed(1)
                    : '0.0';

                console.log('Average barber rating:', avgBarberRating);
                console.log('Average app rating:', avgAppRating);

                // Update summary stats
                const avgBarberRatingEl = document.getElementById('avgBarberRating');
                const avgAppRatingEl = document.getElementById('avgAppRating');

                if (avgBarberRatingEl) avgBarberRatingEl.textContent = avgBarberRating;
                if (avgAppRatingEl) avgAppRatingEl.textContent = avgAppRating;

                // Render ratings list
                const ratingsListEl = document.getElementById('ratingsList');
                if (ratingsListEl) {
                    ratingsListEl.innerHTML = '';

                    ratingsResult.forEach(rating => {
                        const appointment = appointments.find(a => a.id === rating.appointmentId);
                        const barber = barbers.find(b => b.id === rating.barberId);
                        const user = users.find(u => u.id === rating.userId);
                        const service = services.find(s => s.id === appointment?.service_id); // 🔥 AÑADIR ESTO

                        console.log('Processing rating:', rating);
                        console.log('Found appointment:', appointment);
                        console.log('Found barber:', barber);
                        console.log('Found user:', user);
                        console.log('Found service:', service); // 🔥 AÑADIR ESTO

                        if (appointment && barber && user) {
                            // 🔥 CORRECCIÓN: Obtener el nombre del servicio según el idioma
                            let serviceName = 'Servicio no encontrado';
                            if (service) {
                                serviceName = state.currentLanguage === 'es'
                                    ? (service.nameEs || service.name)
                                    : (service.nameEn || service.name);
                            }

                            const ratingCard = document.createElement('div');
                            ratingCard.className = 'admin-card';
                            ratingCard.innerHTML = `
                            <div class="admin-card-header">
                                <h3>${user.name}</h3>
                                <span class="appointment-status status-confirmed">
                                    ${formatDateDisplay(appointment.date)} ${appointment.time}
                                </span>
                            </div>
                            <div class="appointment-details">
                                <div>👤 Barber: ${barber.name}</div>
                                <div>✂️ Service: ${serviceName}</div> <!-- 🔥 CAMBIAR AQUÍ -->
                                <div class="rating-display">
                                    <div class="rating-item">
                                        <span>Barber Rating:</span>
                                        <div class="stars-display">
                                            ${generateStarsHTML(rating.barberRating)}
                                        </div>
                                    </div>
                                    <div class="rating-item">
                                        <span>App Rating:</span>
                                        <div class="stars-display">
                                            ${generateStarsHTML(rating.appRating)}
                                        </div>
                                    </div>
                                </div>
                                ${rating.comment ? `<div class="rating-comment">💬 "${rating.comment}"</div>` : ''}
                            </div>
                        `;
                            ratingsListEl.appendChild(ratingCard);
                        }
                    });
                }
            } else {
                console.log('No ratings found or error loading data');
                // No ratings yet
                const avgBarberRatingEl = document.getElementById('avgBarberRating');
                const avgAppRatingEl = document.getElementById('avgAppRating');
                const ratingsListEl = document.getElementById('ratingsList');

                if (avgBarberRatingEl) avgBarberRatingEl.textContent = '0.0';
                if (avgAppRatingEl) avgAppRatingEl.textContent = '0.0';
                if (ratingsListEl) {
                    ratingsListEl.innerHTML = `
                    <div class="admin-card">
                        <div class="appointment-details">
                            <p>${translations[state.currentLanguage]['admin.noRatings'] || 'No ratings yet'}</p>
                        </div>
                    </div>
                `;
                }
            }
        } catch (error) {
            console.error("Error rendering admin ratings:", error);
            showToast('Error loading ratings', 'error');
        } finally {
            showLoading(false);
        }
    }
}

// Helper function to generate stars HTML
function generateStarsHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
    }
    return starsHTML;
}

export default AdminController;

