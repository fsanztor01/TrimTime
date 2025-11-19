// js/controllers/bookingController.js
import { DatabaseService } from '../services/databaseService.js';
import { translations } from '../services/translation.js';
import { generateId } from '../utils/constants.js';
import {
    formatDate,
    formatDateDisplay,
    formatDays,
    isToday,
    isPast,
    generateTimeSlots,
    isTimeSlotAvailable
} from '../utils/dateUtils.js';
import { showToast, showLoading } from '../utils/uiUtils.js';

export class BookingController {

    static setupEventListeners(state, elements, { updateBookingStep, resetBookingData, showPage, renderAppointments }) {
        console.log('Setting up booking controller event listeners...');

        // Booking navigation
        if (elements.prevStep) {
            elements.prevStep.addEventListener('click', () => {
                if (state.currentBookingStep > 1) {
                    state.currentBookingStep--;
                    updateBookingStep();
                }
            });
        }

        if (elements.nextStep) {
            elements.nextStep.addEventListener('click', () => {
                console.log('Next button clicked, current step:', state.currentBookingStep);

                if (state.currentBookingStep < 4) {
                    if (BookingController.validateCurrentStep(state)) {
                        console.log('Moving to next step:', state.currentBookingStep + 1);
                        state.currentBookingStep++;
                        updateBookingStep();
                    }
                }
                // 🔥 ELIMINADO: No manejar el paso 4 aquí
            });
        }

        if (elements.confirmBooking) {
            elements.confirmBooking.addEventListener('click', () =>
                BookingController.confirmBooking(state, { showPage, renderAppointments })
            );
        }

        // 🔥 ELIMINADO: No hay bookAnother event listener
    }
    static async renderServiceSelection(state, elements) {
        showLoading(true);

        try {
            const result = await DatabaseService.getServices(true);
            const container = document.getElementById('serviceSelection');

            if (container) {
                container.innerHTML = '';

                if (result.success) {
                    result.data.forEach(service => {
                        const option = document.createElement('div');
                        option.className = 'service-option';
                        if (state.bookingData.service && state.bookingData.service.id === service.id) {
                            option.classList.add('selected');
                        }

                        option.innerHTML = `
                            <h4>${service.name}</h4>
                            <p>${service.desc}</p>
                            <div class="service-meta">
                                <span>⏱️ ${service.duration} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</span>
                                <span>$${service.price}</span>
                            </div>
                        `;

                        option.addEventListener('click', () => {
                            state.bookingData.service = service;
                            BookingController.renderServiceSelection(state, elements);
                        });

                        container.appendChild(option);
                    });
                } else {
                    showToast('Error loading services', 'error');
                }
            }
        } catch (error) {
            console.error("Error rendering service selection:", error);
            showToast('Error loading services', 'error');
        } finally {
            showLoading(false);
        }
    }

    static async renderBarberSelection(state, elements) {
        showLoading(true);

        try {
            const result = await DatabaseService.getBarbers(true);
            const container = document.getElementById('barberSelection');

            if (container) {
                container.innerHTML = '';

                if (result.success) {
                    result.data.forEach(barber => {
                        const option = document.createElement('div');
                        option.className = 'barber-option';
                        if (state.bookingData.barber && state.bookingData.barber.id === barber.id) {
                            option.classList.add('selected');
                        }

                        option.innerHTML = `
                            <h4>${barber.name}</h4>
                            <p>${translations[state.currentLanguage]['admin.workingDays'] || 'Days'}: ${formatDays(barber.days)}</p>
                            <p>${translations[state.currentLanguage]['admin.workingHours'] || 'Hours'}: ${barber.hours}</p>
                        `;

                        option.addEventListener('click', () => {
                            state.bookingData.barber = barber;
                            BookingController.renderBarberSelection(state, elements);
                        });

                        container.appendChild(option);
                    });
                } else {
                    showToast('Error loading barbers', 'error');
                }
            }
        } catch (error) {
            console.error("Error rendering barber selection:", error);
            showToast('Error loading barbers', 'error');
        } finally {
            showLoading(false);
        }
    }

    static renderDateTimeSelection(state, elements) {
        BookingController.renderCalendar(state);
        BookingController.renderTimeSlots(state);
    }

    static renderCalendar(state) {
        const container = document.getElementById('calendar');
        if (!container) return;

        // 🔹 Guardar mes/año actuales en el estado si no existen
        if (typeof state.currentMonth !== 'number' || typeof state.currentYear !== 'number') {
            const today = new Date();
            state.currentMonth = today.getMonth();
            state.currentYear = today.getFullYear();
        }

        const month = state.currentMonth;
        const year = state.currentYear;

        // 🔹 Cabecera del calendario
        const months = translations[state.currentLanguage]['calendar.months'].split(',');
        const monthName = months[month];

        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
        <h3>${monthName} ${year}</h3>
        <div class="calendar-nav">
            <button class="btn btn-secondary" id="prevMonth">${translations[state.currentLanguage]['booking.prev'] || 'Previous'}</button>
            <button class="btn btn-secondary" id="nextMonth">${translations[state.currentLanguage]['booking.next'] || 'Next'}</button>
        </div>
    `;

        container.innerHTML = '';
        container.appendChild(header);

        // 🔹 Crear la cuadrícula del calendario
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        const dayHeaders = translations[state.currentLanguage]['calendar.days'].split(',');
        dayHeaders.forEach(day => {
            const el = document.createElement('div');
            el.className = 'calendar-day-header';
            el.textContent = day;
            grid.appendChild(el);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

        const today = new Date();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDate(date);
            const dayOfWeek = date.getDay();

            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            cell.textContent = day;

            // 🔹 Marcar hoy
            if (isToday(date)) cell.classList.add('today');

            // 🔹 Desactivar domingos y días pasados
            if (dayOfWeek === 0) {
                cell.classList.add('disabled');
                cell.title = translations[state.currentLanguage]['calendar.sundayClosed'] || 'Sunday - Closed';
            } else if (date < new Date(today.setHours(0, 0, 0, 0))) {
                cell.classList.add('disabled');
            } else {
                cell.addEventListener('click', () => {
                    state.bookingData.date = dateStr;
                    BookingController.renderCalendar(state);
                    BookingController.renderTimeSlots(state);
                });
            }

            // 🔹 Día seleccionado
            if (state.bookingData.date === dateStr) {
                cell.classList.add('selected');
            }

            grid.appendChild(cell);
        }

        container.appendChild(grid);

        // 🔹 Navegación de meses
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            state.currentMonth = (month === 0) ? 11 : month - 1;
            state.currentYear = (month === 0) ? year - 1 : year;
            BookingController.renderCalendar(state);
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            state.currentMonth = (month === 11) ? 0 : month + 1;
            state.currentYear = (month === 11) ? year + 1 : year;
            BookingController.renderCalendar(state);
        });
    }


    static async renderTimeSlots(state) {
        const container = document.getElementById('timeSlots');
        const filtersContainer = document.getElementById('timeSlotFilters');
        if (!container) return;

        if (!state.bookingData.date) {
            if (filtersContainer) filtersContainer.style.display = 'none';
            container.innerHTML = `
            <div class="time-slots-message">
                ${translations[state.currentLanguage]['pleaseSelectDate'] || 'Please select a date first'}
            </div>
        `;
            return;
        }

        // Show filters if barber and service are selected
        if (filtersContainer && state.bookingData.barber && state.bookingData.service) {
            filtersContainer.style.display = 'block';
            BookingController.setupTimeSlotFilters(state);
        } else if (filtersContainer) {
            filtersContainer.style.display = 'none';
        }

        const timeSlots = generateTimeSlots();
        container.innerHTML = '';

        // Get existing appointments
        const appointmentsResult = await DatabaseService.getAppointments({
            dateFrom: state.bookingData.date,
            dateTo: state.bookingData.date
        });

        const existingAppointments = appointmentsResult.success ? appointmentsResult.data : [];

        // Get filter values
        const showAvailableOnly = document.getElementById('filterAvailableOnly')?.checked ?? true;
        const filterDuration = document.getElementById('filterServiceDuration')?.value;
        const filterBarberHours = document.getElementById('filterBarberHours')?.value;

        // Filter time slots based on barber working hours
        let filteredTimeSlots = timeSlots;
        if (state.bookingData.barber && state.bookingData.barber.hours) {
            const [startHour, endHour] = state.bookingData.barber.hours.split('-').map(h => parseInt(h.split(':')[0]));
            filteredTimeSlots = timeSlots.filter(time => {
                const hour = parseInt(time.split(':')[0]);
                return hour >= startHour && hour < endHour;
            });
        }

        filteredTimeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            // Check availability
            const isAvailable = isTimeSlotAvailable(
                state.bookingData.date,
                time,
                state.bookingData.barber?.id,
                existingAppointments,
                state.bookingData.originalAppointmentId
            );

            // Check if slot fits service duration
            const serviceDuration = state.bookingData.service?.duration || 30;
            const [slotHour, slotMinute] = time.split(':').map(Number);
            const slotStart = slotHour * 60 + slotMinute;
            const slotEnd = slotStart + serviceDuration;
            
            // Check if slot would conflict with existing appointments
            let fitsDuration = true;
            if (state.bookingData.barber) {
                existingAppointments.forEach(apt => {
                    if (apt.employee_id === state.bookingData.barber.id && 
                        apt.date === state.bookingData.date && 
                        apt.status !== 'canceled') {
                        const [aptHour, aptMinute] = apt.time.split(':').map(Number);
                        const aptStart = aptHour * 60 + aptMinute;
                        const aptEnd = aptStart + (apt.duration || 30);
                        
                        if ((slotStart < aptEnd && slotEnd > aptStart)) {
                            fitsDuration = false;
                        }
                    }
                });
            }

            // Apply filters
            if (showAvailableOnly && !isAvailable) {
                slot.classList.add('disabled');
                slot.title = translations[state.currentLanguage]['booking.slotUnavailable'] || 'This slot is unavailable';
            } else if (!fitsDuration) {
                slot.classList.add('disabled');
                slot.title = translations[state.currentLanguage]['booking.slotConflict'] || 'Service duration conflicts with existing appointment';
            } else if (isAvailable && fitsDuration) {
                if (state.bookingData.time === time) {
                    slot.classList.add('selected');
                }
                slot.addEventListener('click', () => {
                    state.bookingData.time = time;
                    BookingController.renderTimeSlots(state);
                });
            } else {
                slot.classList.add('disabled');
                slot.title = translations[state.currentLanguage]['booking.slotUnavailable'] || 'This slot is unavailable';
            }

            container.appendChild(slot);
        });
    }

    static setupTimeSlotFilters(state) {
        // Setup filter for service duration
        const durationFilter = document.getElementById('filterServiceDuration');
        if (durationFilter && state.bookingData.service) {
            const currentDuration = state.bookingData.service.duration;
            durationFilter.innerHTML = '<option value="">All durations</option>';
            const durations = [15, 20, 30, 45, 60];
            durations.forEach(dur => {
                const option = document.createElement('option');
                option.value = dur;
                option.textContent = `${dur} min`;
                if (dur === currentDuration) option.selected = true;
                durationFilter.appendChild(option);
            });
            
            durationFilter.addEventListener('change', () => {
                BookingController.renderTimeSlots(state);
            });
        }

        // Setup filter for barber hours
        const barberHoursFilter = document.getElementById('filterBarberHours');
        if (barberHoursFilter && state.bookingData.barber) {
            barberHoursFilter.innerHTML = '<option value="">All hours</option>';
            const hours = state.bookingData.barber.hours || '09:00-17:00';
            const option = document.createElement('option');
            option.value = hours;
            option.textContent = hours;
            option.selected = true;
            barberHoursFilter.appendChild(option);
        }

        // Setup available only filter
        const availableOnlyFilter = document.getElementById('filterAvailableOnly');
        if (availableOnlyFilter) {
            availableOnlyFilter.addEventListener('change', () => {
                BookingController.renderTimeSlots(state);
            });
        }
    }

    static renderBookingSummary(state) {
        const container = document.getElementById('bookingSummary');
        if (!container) return;

        container.innerHTML = `
            <h3>${translations[state.currentLanguage]['booking.summary'] || 'Booking Summary'}</h3>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.service'] || 'Service'}:</span>
                <span>${state.bookingData.service?.name || translations[state.currentLanguage]['booking.notSelected'] || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.barber'] || 'Barber'}:</span>
                <span>${state.bookingData.barber?.name || translations[state.currentLanguage]['booking.notSelected'] || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.date'] || 'Date'}:</span>
                <span>${formatDateDisplay(state.bookingData.date) || translations[state.currentLanguage]['booking.notSelected'] || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.time'] || 'Time'}:</span>
                <span>${state.bookingData.time || translations[state.currentLanguage]['booking.notSelected'] || 'Not selected'}</span>
            </div>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.duration'] || 'Duration'}:</span>
                <span>${state.bookingData.service?.duration || 0} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</span>
            </div>
            <div class="summary-row">
                <span>${translations[state.currentLanguage]['booking.price'] || 'Price'}:</span>
                <span>$${state.bookingData.service?.price || 0}</span>
            </div>
        `;
    }

    static validateCurrentStep(state) {
        console.log('Validating step:', state.currentBookingStep, 'Data:', state.bookingData);

        switch (state.currentBookingStep) {
            case 1:
                if (!state.bookingData.service) {
                    showToast(translations[state.currentLanguage]['booking.selectServiceFirst'] || 'Please select a service first', 'error');
                    return false;
                }
                return true;
            case 2:
                if (!state.bookingData.barber) {
                    showToast(translations[state.currentLanguage]['booking.selectBarberFirst'] || 'Please select a barber first', 'error');
                    return false;
                }
                return true;
            case 3:
                if (!state.bookingData.date || !state.bookingData.time) {
                    showToast(translations[state.currentLanguage]['booking.selectDateTimeFirst'] || 'Please select date and time first', 'error');
                    return false;
                }
                return true;
            case 4:
                // 🔥 CORRECCIÓN: En el paso 4 siempre permitir avanzar (ir a citas)
                return true;
            default:
                return true;
        }
    }
    static async confirmBooking(state, { showPage, renderAppointments }) {
        if (!BookingController.validateCurrentStep(state)) return;

        try {
            // Verificar disponibilidad del horario
            const appointmentsResult = await DatabaseService.getAppointments({
                dateFrom: state.bookingData.date,
                dateTo: state.bookingData.date
            });

            if (appointmentsResult.success) {
                const existingAppointments = appointmentsResult.data;
                const hasConflict = existingAppointments.some(a => {
                    if (a.id === state.bookingData.originalAppointmentId) return false;
                    if (a.date !== state.bookingData.date || a.employee_id !== state.bookingData.barber.id) return false;
                    if (a.status === 'canceled' || a.status === 'rescheduling') return false;

                    const [existingHour, existingMinute] = a.time.split(':').map(Number);
                    const [newHour, newMinute] = state.bookingData.time.split(':').map(Number);
                    const existingStart = existingHour * 60 + existingMinute;
                    const existingEnd = existingStart + (a.duration || 30);
                    const newStart = newHour * 60 + newMinute;
                    const newEnd = newStart + (state.bookingData.service?.duration || 30);

                    return (newStart < existingEnd && newEnd > existingStart);
                });

                if (hasConflict) {
                    showToast('Este horario ya está ocupado. Por favor selecciona otro.', 'error');
                    return;
                }
            }

            // Reprogramación de cita existente
            if (state.bookingData.originalAppointmentId) {
                // 1. Obtener cita original
                const appointmentsResult = await DatabaseService.getAppointments();
                if (!appointmentsResult.success) {
                    showToast('Error al obtener la cita original', 'error');
                    return;
                }

                const originalAppointment = appointmentsResult.data.find(a => a.id === state.bookingData.originalAppointmentId);
                if (!originalAppointment) {
                    showToast('Cita original no encontrada', 'error');
                    return;
                }

                // 2. Cancelar cita original
                const cancelResult = await DatabaseService.updateAppointment(
                    state.bookingData.originalAppointmentId,
                    {
                        status: 'canceled',
                        notes: 'Cita cancelada por reprogramación',
                        updatedAt: new Date().toISOString()
                    }
                );

                if (!cancelResult.success) {
                    showToast('Error al cancelar la cita original', 'error');
                    return;
                }

                // 3. Crear nueva cita con estado pending
                const newAppointment = {
                    id: generateId(),
                    client_id: originalAppointment.client_id,
                    employee_id: state.bookingData.barber.id,
                    service_id: state.bookingData.service.id,
                    date: state.bookingData.date,
                    time: state.bookingData.time,
                    status: 'pending',
                    price: state.bookingData.service.price,
                    duration: state.bookingData.service.duration,
                    rescheduledFrom: state.bookingData.originalAppointmentId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const saveResult = await DatabaseService.saveAppointment(newAppointment);

                if (saveResult.success) {
                    showToast('Cita reprogramada exitosamente. Espera la confirmación del administrador.', 'success');

                    // Actualizar calendario del admin
                    if (typeof window.__redrawAdminCalendar === 'function') {
                        window.__redrawAdminCalendar();
                    }

                    // 🔥 AÑADIR resetBookingAfterConfirmation AQUÍ
                    if (typeof resetBookingAfterConfirmation === 'function') {
                        resetBookingAfterConfirmation();
                    }

                    // 🔥 CORRECCIÓN: Ir directamente a appointments después de confirmar
                    setTimeout(() => {
                        showPage('myAppointmentsPage');
                        if (renderAppointments) renderAppointments();
                    }, 1000);

                    // Limpiar datos
                    state.bookingData.originalAppointmentId = null;

                } else {
                    showToast('Error al crear la nueva cita', 'error');
                }
            } else {
                // Nueva cita normal
                const newAppointment = {
                    id: generateId(),
                    client_id: state.currentUser.id,
                    employee_id: state.bookingData.barber.id,
                    service_id: state.bookingData.service.id,
                    date: state.bookingData.date,
                    time: state.bookingData.time,
                    status: 'pending',
                    price: state.bookingData.service.price,
                    duration: state.bookingData.service.duration,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const result = await DatabaseService.saveAppointment(newAppointment);

                if (result.success) {
                    showToast(translations[state.currentLanguage]['booking.success'] || 'Appointment booked successfully! Waiting for admin confirmation.', 'success');

                    // Actualizar calendario del admin
                    if (typeof window.__redrawAdminCalendar === 'function') {
                        window.__redrawAdminCalendar();
                    }

                    // 🔥 AÑADIR resetBookingAfterConfirmation AQUÍ
                    if (typeof resetBookingAfterConfirmation === 'function') {
                        resetBookingAfterConfirmation();
                    }

                    // 🔥 CORRECCIÓN: Ir directamente a appointments después de confirmar
                    setTimeout(() => {
                        showPage('myAppointmentsPage');
                        if (renderAppointments) renderAppointments();
                    }, 1000);

                } else {
                    showToast('Error booking appointment', 'error');
                }
            }
        } catch (error) {
            console.error("Error booking appointment:", error);
            showToast('Error booking appointment', 'error');
        }
    }
    static bookAnotherAppointment(state, { resetBookingData, updateBookingStep }) {
        console.log('Reiniciando para nueva cita...');

        // Resetear datos
        resetBookingData();

        // Volver al paso 1
        state.currentBookingStep = 1;
        updateBookingStep();

        // Restaurar visibilidad de botones
        const confirmBooking = document.getElementById('confirmBooking');
        const bookAnother = document.getElementById('bookAnother');
        const nextStep = document.getElementById('nextStep');

        if (confirmBooking) {
            confirmBooking.style.display = 'none'; // Ocultar hasta paso 4
        }
        if (bookAnother) {
            bookAnother.style.display = 'none'; // Ocultar hasta confirmar
        }
        if (nextStep) {
            nextStep.style.display = 'inline-block'; // Mostrar Next
            nextStep.disabled = false;
            nextStep.textContent = translations[state.currentLanguage]['booking.next'] || 'Next';
        }

        console.log('Sistema listo para una nueva cita.');
    }

    static renderAppointmentsForDate(dateStr, allAppointments) {
        const container = document.getElementById('appointmentsForDay');
        if (!container) return;

        const appointments = allAppointments.filter(a => a.date === dateStr);

        container.innerHTML = `
        <h4>Citas del ${formatDateDisplay(dateStr)}</h4>
        ${appointments.length === 0
                ? '<p>No hay citas para este día.</p>'
                : appointments.map(a => `
                <div class="appointment-item">
                    <strong>${a.time}</strong> - ${a.service_id} (${a.status})
                </div>
            `).join('')}
    `;
    }

}