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
                    AdminController.renderAdminAppointments(state, elements);
                    if (typeof window.__redrawAdminCalendar === 'function') window.__redrawAdminCalendar();
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
            case 'stats':
                AdminController.renderAdminStats(state, elements);
                break;
        }
    }
    // =============== CALENDARIO ===============
    static renderAdminCalendar(state, elements) {
        const container = document.getElementById('adminCalendar');
        if (!container) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const header = document.createElement('div');
        header.className = 'calendar-header';

        const months = translations[state.currentLanguage]['calendar.months'].split(',');
        const monthName = months[currentMonth];

        header.innerHTML = `
            <h3>${monthName} ${currentYear}</h3>
            <div class="calendar-nav">
                <button class="btn btn-secondary" id="adminPrevMonth">${translations[state.currentLanguage]['booking.prev'] || 'Previous'}</button>
                <button class="btn btn-secondary" id="adminNextMonth">${translations[state.currentLanguage]['booking.next'] || 'Next'}</button>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Cabeceras de días
        const dayHeaders = translations[state.currentLanguage]['calendar.days'].split(',');
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Cálculo de primer día y total de días
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        const isSameDate = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        DatabaseService.getAppointments().then(result => {
            if (!result.success) return;
            const appointments = result.data.filter(a => !a.deleted);

            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;

                const date = new Date(currentYear, currentMonth, day);
                const dateStr = formatDate(date);
                const dayOfWeek = date.getDay(); // 0 = Sunday

                if (isSameDate(date, new Date())) {
                    dayElement.classList.add('today');
                    dayElement.title = translations[state.currentLanguage]['calendar.today'] || 'Today';
                }

                if (dayOfWeek === 0) {
                    dayElement.classList.add('disabled');
                    dayElement.title = translations[state.currentLanguage]['calendar.sundayClosed'] || 'Sunday - Closed';
                }

                const dayAppointments = appointments.filter(a => a.date === dateStr);
                if (dayAppointments.length > 0) {
                    dayElement.style.position = 'relative';

                    const STATUSES = ["canceled", "completed", "pending", "confirmed"];
                    const COLORS = {
                        canceled: "red",
                        completed: "blue",
                        pending: "yellow",
                        confirmed: "green"
                    };

                    const statusesPresent = new Set(dayAppointments.map(a => a.status));
                    let offset = 0;
                    STATUSES.forEach(st => {
                        if (statusesPresent.has(st) && offset < 4) {
                            const dot = document.createElement('div');
                            dot.style.position = 'absolute';
                            dot.style.bottom = '5px';
                            dot.style.left = `${5 + offset * 12}px`;
                            dot.style.width = '8px';
                            dot.style.height = '8px';
                            dot.style.borderRadius = '50%';
                            dot.style.backgroundColor = COLORS[st];
                            dot.title = st;
                            dayElement.appendChild(dot);
                            offset++;
                        }
                    });

                    dayElement.addEventListener('click', () => {
                        AdminController.showDayAppointments(dateStr, state);
                    });
                }

                grid.appendChild(dayElement);
            }
        });

        container.appendChild(grid);

        document.getElementById('adminPrevMonth')?.addEventListener('click', () => {
            showToast('Previous month navigation not implemented in this demo', 'warning');
        });
        document.getElementById('adminNextMonth')?.addEventListener('click', () => {
            showToast('Next month navigation not implemented in this demo', 'warning');
        });
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
}

export default AdminController;

