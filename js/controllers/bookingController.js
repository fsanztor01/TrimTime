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

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Create calendar header
        const header = document.createElement('div');
        header.className = 'calendar-header';

        const months = translations[state.currentLanguage]['calendar.months'].split(',');
        const monthName = months[currentMonth];

        header.innerHTML = `
            <h3>${monthName} ${currentYear}</h3>
            <div class="calendar-nav">
                <button class="btn btn-secondary" id="prevMonth">${translations[state.currentLanguage]['booking.prev'] || 'Previous'}</button>
                <button class="btn btn-secondary" id="nextMonth">${translations[state.currentLanguage]['booking.next'] || 'Next'}</button>
            </div>
        `;

        container.innerHTML = '';
        container.appendChild(header);

        // Create calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Add day headers
        const dayHeaders = translations[state.currentLanguage]['calendar.days'].split(',');
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            grid.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const date = new Date(currentYear, currentMonth, day);
            const dateStr = formatDate(date);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

            // Check if day is today
            if (isToday(date)) {
                dayElement.classList.add('today');
                dayElement.title = translations[state.currentLanguage]['calendar.today'] || 'Today';
            }

            // Check if day is in the past or Sunday (closed)
            if (isPast(date) || dayOfWeek === 0) {
                dayElement.classList.add('disabled');
                if (dayOfWeek === 0) {
                    dayElement.title = translations[state.currentLanguage]['calendar.sundayClosed'] || 'Sunday - Closed';
                }
            } else {
                dayElement.addEventListener('click', () => {
                    state.bookingData.date = dateStr;
                    BookingController.renderCalendar(state);
                    BookingController.renderTimeSlots(state);
                });
            }

            // Check if day is selected
            if (state.bookingData.date === dateStr) {
                dayElement.classList.add('selected');
            }

            grid.appendChild(dayElement);
        }

        container.appendChild(grid);

        // Add event listeners for navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            showToast('Previous month navigation not implemented in this demo', 'warning');
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            showToast('Next month navigation not implemented in this demo', 'warning');
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

            // Check if time slot is available
            if (isTimeSlotAvailable(state.bookingData.date, time, state.bookingData.barber?.id, existingAppointments)) {
                if (state.bookingData.time === time) {
                    slot.classList.add('selected');
                }

                slot.addEventListener('click', () => {
                    state.bookingData.time = time;
                    BookingController.renderTimeSlots(state);
                });
            } else {
                slot.classList.add('disabled');
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

                // CORRECCIÓN: Habilitar el botón Next para que pueda redirigir a citas
                if (nextStep) {
                    nextStep.disabled = false;
                }
            } else {
                showToast('Error booking appointment', 'error');
            }
        } catch (error) {
            console.error("Error booking appointment:", error);
            showToast('Error booking appointment', 'error');
        }
    }

    static bookAnotherAppointment(state, { resetBookingData, updateBookingStep }) {
        // Reset booking data and start over
        resetBookingData();
        const confirmBooking = document.getElementById('confirmBooking');
        const bookAnother = document.getElementById('bookAnother');

        if (confirmBooking) {
            confirmBooking.style.display = 'block';
        }
        if (bookAnother) {
            bookAnother.style.display = 'none';
        }
        updateBookingStep();
    }
}