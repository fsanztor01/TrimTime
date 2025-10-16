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
                // CORRECCIÓN: Si estamos en el paso 4 y ya hemos reservado, ir a citas
                if (state.currentBookingStep === 4 && elements.bookAnother && elements.bookAnother.style.display !== 'none') {
                    showPage('myAppointmentsPage');
                    renderAppointments();
                }
                // MODIFICACIÓN: Si el texto del botón es "Ver Mis Citas", ir a la página de citas
                else if (state.currentBookingStep === 4 && elements.nextStep.textContent === 'Ver Mis Citas') {
                    showPage('myAppointmentsPage');
                    renderAppointments();
                }
                // Si no, comportamiento normal del botón Next
                else if (state.currentBookingStep < 4 && BookingController.validateCurrentStep(state)) {
                    state.currentBookingStep++;
                    updateBookingStep();
                }
            });
        }

        if (elements.confirmBooking) {
            elements.confirmBooking.addEventListener('click', () => BookingController.confirmBooking(state));
        }

        if (elements.bookAnother) {
            elements.bookAnother.addEventListener('click', () => BookingController.bookAnotherAppointment(state, { resetBookingData, updateBookingStep }));
        }
    }

    // ... (rest of the code)
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
        if (!container) return;

        if (!state.bookingData.date) {
            container.innerHTML = `
            <div class="time-slots-message">
                ${translations[state.currentLanguage]['pleaseSelectDate'] || 'Please select a date first'}
            </div>
        `;
            return;
        }

        const timeSlots = generateTimeSlots();
        container.innerHTML = '';

        // Obtener citas existentes para verificar disponibilidad
        const appointmentsResult = await DatabaseService.getAppointments({
            dateFrom: state.bookingData.date,
            dateTo: state.bookingData.date
        });

        const existingAppointments = appointmentsResult.success ? appointmentsResult.data : [];

        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            // Verificar si el horario está disponible
            const isAvailable = isTimeSlotAvailable(
                state.bookingData.date,
                time,
                state.bookingData.barber?.id,
                existingAppointments,
                state.bookingData.originalAppointmentId // Pasar ID de cita original para ignorarla
            );

            if (isAvailable) {
                if (state.bookingData.time === time) {
                    slot.classList.add('selected');
                }

                slot.addEventListener('click', () => {
                    state.bookingData.time = time;
                    BookingController.renderTimeSlots(state);
                });
            } else {
                slot.classList.add('disabled');
                slot.title = 'Este horario ya está ocupado';
            }

            container.appendChild(slot);
        });
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
            default:
                return true;
        }
    }



    static async confirmBooking(state) {
        if (!BookingController.validateCurrentStep(state)) return;

        try {
            // Verificar si el horario está disponible ANTES de confirmar
            const appointmentsResult = await DatabaseService.getAppointments({
                dateFrom: state.bookingData.date,
                dateTo: state.bookingData.date
            });

            if (appointmentsResult.success) {
                const existingAppointments = appointmentsResult.data;

                // Verificar si hay conflicto con otra cita
                const hasConflict = existingAppointments.some(a => {
                    if (a.id === state.bookingData.originalAppointmentId) return false; // Ignorar la cita original

                    if (a.date !== state.bookingData.date || a.employee_id !== state.bookingData.barber.id) return false;
                    if (a.status === 'canceled' || a.status === 'rescheduling') return false;

                    // Parsear tiempos
                    const [existingHour, existingMinute] = a.time.split(':').map(Number);
                    const [newHour, newMinute] = state.bookingData.time.split(':').map(Number);

                    // Convertir a minutos
                    const existingStart = existingHour * 60 + existingMinute;
                    const existingEnd = existingStart + (a.duration || 30);
                    const newStart = newHour * 60 + newMinute;
                    const newEnd = newStart + (state.bookingData.service?.duration || 30);

                    // Verificar si hay solapamiento
                    return (newStart < existingEnd && newEnd > existingStart);
                });

                if (hasConflict) {
                    showToast('Este horario ya está ocupado. Por favor selecciona otro.', 'error');
                    return;
                }
            }

            // Si estamos reprogramando una cita existente
            if (state.bookingData.originalAppointmentId) {
                // Actualizar la cita original con los nuevos datos
                const updateResult = await DatabaseService.updateAppointment(
                    state.bookingData.originalAppointmentId,
                    {
                        date: state.bookingData.date,
                        time: state.bookingData.time,
                        employee_id: state.bookingData.barber.id,
                        service_id: state.bookingData.service.id,
                        status: 'pending' // Volver a estado pendiente para confirmación
                    }
                );

                if (updateResult.success) {
                    showToast('Cita reprogramada con éxito', 'success');

                    // 🔹 Refrescar citas del cliente
                    const pageId = state.currentUser.role === 'admin' ? 'adminDashboardPage' : 'myAppointmentsPage';
                    setTimeout(() => {
                        const { showPage } = window; // Usa la función global de navegación
                        if (showPage) {
                            showPage(pageId);
                        }
                    }, 500);


                    // Limpiar datos de reserva
                    state.bookingData.originalAppointmentId = null;

                    // CORRECCIÓN: Configurar botones después de reprogramar
                    const confirmBooking = document.getElementById('confirmBooking');
                    const bookAnother = document.getElementById('bookAnother');
                    const nextStep = document.getElementById('nextStep');

                    if (confirmBooking) {
                        confirmBooking.style.display = 'none';
                    }
                    if (bookAnother) {
                        bookAnother.style.display = 'none';
                    }
                    if (nextStep) {
                        nextStep.disabled = false; // Asegurar que el botón esté habilitado
                        nextStep.textContent = 'Ver Mis Citas';
                    }
                } else {
                    showToast('Error al reprogramar cita', 'error');
                }
            } else {
                // Si es una nueva cita
                const newAppointment = {
                    id: generateId(),
                    client_id: state.currentUser.id,
                    employee_id: state.bookingData.barber.id,
                    service_id: state.bookingData.service.id,
                    date: state.bookingData.date,
                    time: state.bookingData.time,
                    status: 'pending',
                    price: state.bookingData.service.price,
                    duration: state.bookingData.service.duration
                };

                const result = await DatabaseService.saveAppointment(newAppointment);

                if (result.success) {
                    showToast(translations[state.currentLanguage]['booking.success'] || 'Appointment booked successfully!', 'success');

                    // Mostrar botón para reservar otra cita
                    const confirmBooking = document.getElementById('confirmBooking');
                    const bookAnother = document.getElementById('bookAnother');
                    const nextStep = document.getElementById('nextStep');

                    if (confirmBooking) {
                        confirmBooking.style.display = 'none';
                    }
                    if (bookAnother) {
                        bookAnother.style.display = 'block';
                    }
                    if (nextStep) {
                        nextStep.disabled = false; // Asegurar que el botón esté habilitado
                    }
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

        // 🔹 1. Resetear los datos del booking
        resetBookingData();

        // 🔹 2. Volver al paso 1 (seleccionar servicio)
        state.currentBookingStep = 1;
        updateBookingStep();

        // 🔹 3. Reactivar y mostrar botones correctamente
        const confirmBooking = document.getElementById('confirmBooking');
        const bookAnother = document.getElementById('bookAnother');
        const nextStep = document.getElementById('nextStep');
        const prevStep = document.getElementById('prevStep');

        if (confirmBooking) confirmBooking.style.display = 'block';
        if (bookAnother) bookAnother.style.display = 'none';

        // 🔹 4. Asegurar que "Next" está habilitado y visible
        if (nextStep) {
            nextStep.disabled = false;
            nextStep.style.display = 'inline-block';
            nextStep.textContent = 'Next';
        }

        // 🔹 5. Deshabilitar "Previous" al inicio
        if (prevStep) prevStep.disabled = true;

        // 🔹 6. Limpiar posibles mensajes o vistas previas
        const bookingSummary = document.getElementById('bookingSummary');
        if (bookingSummary) bookingSummary.innerHTML = '';

        const timeSlots = document.getElementById('timeSlots');
        if (timeSlots) timeSlots.innerHTML = '';

        const calendar = document.getElementById('calendar');
        if (calendar) calendar.innerHTML = '';

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