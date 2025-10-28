// js/app.js
import { DatabaseService } from './services/databaseService.js';
import { translations } from './services/translation.js';
import { generateId } from './utils/constants.js';
import {
    formatDate,
    formatDateDisplay,
    formatDays,
    isToday,
    isPast,
    generateTimeSlots,
    isTimeSlotAvailable,
    getStatusColor
} from './utils/dateUtils.js';
import {
    showToast,
    showLoading
} from './utils/uiUtils.js';
import { AuthController } from './controllers/authController.js';
import { BookingController } from './controllers/bookingController.js';
import { ProfileController } from './controllers/profileController.js';
import { AdminController } from './controllers/adminController.js';

// App State
const state = {
    currentUser: null,
    currentLanguage: 'en',
    currentTheme: 'dark',
    currentPage: 'loginPage',
    bookingData: {
        service: null,
        barber: null,
        date: null,
        time: null
    },
    currentBookingStep: 1,
    realtimeUnsubscribe: null
};
window.state = state;


// DOM Elements
const elements = {
    pages: document.querySelectorAll('.page'),
    navBtns: document.querySelectorAll('.nav-btn'),
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    bottomNav: document.getElementById('bottomNav'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    // Client elements
    clientName: document.getElementById('clientName'),
    bookAppointmentBtn: document.getElementById('bookAppointmentBtn'),
    viewServicesBtn: document.getElementById('viewServicesBtn'),
    myAppointmentsBtn: document.getElementById('myAppointmentsBtn'),
    servicesList: document.getElementById('servicesList'),
    barbersList: document.getElementById('barbersList'),
    // Booking elements
    prevStep: document.getElementById('prevStep'),
    nextStep: document.getElementById('nextStep'),
    confirmBooking: document.getElementById('confirmBooking'),
    bookAnother: document.getElementById('bookAnother'),
    // Profile elements
    profileForm: document.getElementById('profileForm'),
    profilePhoto: document.getElementById('profilePhoto'),
    photoInput: document.getElementById('photoInput'),
    changePhotoBtn: document.getElementById('changePhotoBtn'),
    contactForm: document.getElementById('contactForm'),
    ratingStars: document.querySelectorAll('.star'),
    submitRating: document.getElementById('submitRating'),
    // Admin elements
    adminTabBtns: document.querySelectorAll('.admin-tab-btn'),
    adminTabPanes: document.querySelectorAll('.admin-tab-pane'),
    addServiceBtn: document.getElementById('addServiceBtn'),
    addBarberBtn: document.getElementById('addBarberBtn'),
    filterAppointments: document.getElementById('filterAppointments')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing app...');

    // Inicializar datos por defecto
    DatabaseService.initializeData();

    // Check for saved theme and language
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedLanguage = localStorage.getItem('language') || 'en';

    setTheme(savedTheme);
    setLanguage(savedLanguage);

    // Verificar si hay un usuario guardado en sessionStorage
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        showUserInterface();
    } else {
        showPage('loginPage');
        elements.bottomNav.classList.add('hidden');

        // Hide admin button when no user is logged in
        const adminBtn = document.getElementById('adminNavBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    }

    // Set up event listeners
    setupEventListeners();

    console.log('App initialized successfully');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    // Language toggle
    if (elements.langToggle) {
        elements.langToggle.addEventListener('click', toggleLanguage);

        // Admin button (engranaje en header)
        const adminBtn = document.getElementById('adminNavBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                showPage('adminDashboardPage');
            });
        }

    }

    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            showPage(page);
        });
    });

    // MEJORA: Agregar event listener para el botón de reservar cita en el panel inferior
    const bookAppointmentNavBtn = document.querySelector('[data-page="bookAppointmentPage"]');
    if (bookAppointmentNavBtn) {
        bookAppointmentNavBtn.addEventListener('click', () => {
            resetBookingData();
            showPage('bookAppointmentPage');
        });
    }

    // Client actions
    if (elements.bookAppointmentBtn) {
        elements.bookAppointmentBtn.addEventListener('click', () => {
            resetBookingData();
            showPage('bookAppointmentPage');
        });
    }

    if (elements.viewServicesBtn) {
        elements.viewServicesBtn.addEventListener('click', () => {
            showPage('servicesPage');
            renderServices();
        });
    }

    if (elements.myAppointmentsBtn) {
        elements.myAppointmentsBtn.addEventListener('click', () => {
            showPage('myAppointmentsPage');
            renderAppointments();
        });
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            showTab(tab);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Apply date range button - CORRECCIÓN: Usar la función del AdminController
    const applyDateRangeBtn = document.getElementById('applyDateRange');
    if (applyDateRangeBtn) {
        applyDateRangeBtn.addEventListener('click', () => {
            AdminController.renderAdminStats(state, elements);
        });
    }

    // Setup controllers - CORRECCIÓN: Pasar las funciones necesarias como parámetros
    AuthController.setupEventListeners(state, elements, {
        showPage,
        showUserInterface,
        setLanguage
    });

    BookingController.setupEventListeners(state, elements, {
        updateBookingStep,
        resetBookingData,
        showPage,
        renderAppointments
    });

    ProfileController.setupEventListeners(state, elements);

    AdminController.setupEventListeners(state, elements);

    console.log('Event listeners set up successfully');
}

// UI Navigation

function showPage(pageId) {
    console.log('Showing page:', pageId);

    // Hide all pages
    elements.pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        state.currentPage = pageId;
    } else {
        console.error('Page not found:', pageId);
        return;
    }

    // Cancelar suscripciones anteriores
    if (state.realtimeUnsubscribe) {
        state.realtimeUnsubscribe();
        state.realtimeUnsubscribe = null;
    }

    // Configurar nueva suscripción si es necesario
    if (pageId === 'myAppointmentsPage') {
        state.realtimeUnsubscribe = setupRealtimeAppointments();
    }

    // Update navigation
    updateNavigation();

    // Page-specific initialization
    if (pageId === 'servicesPage') {
        renderServices();
    } else if (pageId === 'myAppointmentsPage') {
        renderAppointments();
    } else if (pageId === 'profilePage') {
        renderProfile();
    } else if (pageId === 'adminDashboardPage') {
        renderAdminDashboard();
    } else if (pageId === 'bookAppointmentPage') {
        renderBookingStep();
    } else if (pageId === 'clientHomePage') {
        renderHomePage();
        renderBarbers();
    }

    // Ensure admin button visibility is updated
    const adminBtn = document.getElementById('adminNavBtn');
    if (adminBtn) {
        if (state.currentUser && state.currentUser.role === 'admin') {
            adminBtn.style.display = 'flex';
            if (pageId === 'adminDashboardPage') {
                adminBtn.classList.add('active');
            } else {
                adminBtn.classList.remove('active');
            }
        } else {
            adminBtn.style.display = 'none';
        }
    }
}

function updateNavigation() {
    if (state.currentUser) {
        elements.bottomNav.classList.remove('hidden');

        // Admin button visibility
        const adminBtn = document.getElementById('adminNavBtn');
        if (adminBtn) {
            if (state.currentUser.role === 'admin') {
                adminBtn.style.display = 'flex';
                if (state.currentPage === 'adminDashboardPage') {
                    adminBtn.classList.add('active');
                } else {
                    adminBtn.classList.remove('active');
                }
            } else {
                adminBtn.style.display = 'none';
            }
        }

        // Update botones inferiores
        elements.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === state.currentPage) {
                btn.classList.add('active');
            }
        });
    } else {
        elements.bottomNav.classList.add('hidden');

        // Hide admin button when no user is logged in
        const adminBtn = document.getElementById('adminNavBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    }
}


function showUserInterface() {
    console.log('Showing user interface for role:', state.currentUser?.role);

    if (state.currentUser.role === 'admin') {
        showPage('adminDashboardPage');
    } else {
        showPage('clientHomePage');
        if (elements.clientName) {
            elements.clientName.textContent = state.currentUser.name;
        }
    }
}

// Theme and Language
function toggleTheme() {
    const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update theme icon
    const themeToggleEl = elements.themeToggle || document.getElementById('themeToggle');
    const icon = themeToggleEl ? themeToggleEl.querySelector('.icon') : null;
    if (icon) {
        icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

function toggleLanguage() {
    const newLang = state.currentLanguage === 'en' ? 'es' : 'en';
    setLanguage(newLang);
}

function setLanguage(lang) {
    state.currentLanguage = lang;
    localStorage.setItem('language', lang);

    // 🔥 Actualizar traducciones en DB
    DatabaseService.updateServicesLanguage(lang);
    DatabaseService.updateBarbersLanguage(lang);

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update language icon with flag
    const langToggleEl = elements.langToggle || document.getElementById('langToggle');
    const icon = langToggleEl ? langToggleEl.querySelector('.icon') : null;
    if (icon) {
        icon.textContent = lang === 'en' ? '🇬🇧' : '🇪🇸';
    }

    // Re-render dynamic content
    if (state.currentPage === 'servicesPage') {
        renderServices();
    } else if (state.currentPage === 'myAppointmentsPage') {
        renderAppointments();
    } else if (state.currentPage === 'profilePage') {
        renderProfile();
    } else if (state.currentPage === 'bookAppointmentPage') {
        renderBookingStep();
    } else if (state.currentPage === 'adminDashboardPage') {
        renderAdminDashboard();
    } else if (state.currentPage === 'clientHomePage') {
        renderHomePage();
        renderBarbers();
    }
}


// Home Page
function renderHomePage() {
    // Update shop description and address based on language
    const shopDescription = document.querySelector('.shop-description');
    const shopAddressTitle = document.querySelector('.shop-address h3');
    const shopAddress = document.querySelector('.shop-address p:first-of-type');
    const shopHours = document.querySelector('.shop-address p:last-of-type');

    if (shopDescription) {
        shopDescription.textContent = translations[state.currentLanguage]['home.description'];
    }

    if (shopAddressTitle) {
        shopAddressTitle.textContent = translations[state.currentLanguage]['home.addressTitle'];
    }

    if (shopAddress) {
        shopAddress.textContent = translations[state.currentLanguage]['home.address'];
    }

    if (shopHours) {
        shopHours.textContent = translations[state.currentLanguage]['home.hours'];
    }
}

// Barbers
async function renderBarbers() {
    showLoading(true);

    try {
        const result = await DatabaseService.getBarbers(true);
        const container = elements.barbersList;

        if (container) {
            container.innerHTML = '';

            if (result.success) {
                result.data.forEach(barber => {
                    const barberCard = document.createElement('div');
                    barberCard.className = 'barber-card';

                    // Generate star rating HTML
                    const fullStars = Math.floor(barber.rating);
                    const hasHalfStar = barber.rating % 1 !== 0;
                    let starsHTML = '';

                    for (let i = 0; i < fullStars; i++) {
                        starsHTML += '<span class="rating-star">★</span>';
                    }

                    if (hasHalfStar) {
                        starsHTML += '<span class="rating-star">☆</span>';
                    }

                    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
                        starsHTML += '<span class="rating-star" style="opacity: 0.3">★</span>';
                    }

                    barberCard.innerHTML = `
                        <img src="${barber.photo}" alt="${barber.name}">
                        <div class="barber-info">
                            <div class="barber-name">${barber.name}</div>
                            <div class="barber-rating">
                                ${starsHTML}
                                <span class="rating-value">${barber.rating}</span>
                            </div>
                        </div>
                    `;

                    container.appendChild(barberCard);
                });
            } else {
                showToast('Error loading barbers', 'error');
            }
        }
    } catch (error) {
        console.error("Error rendering barbers:", error);
        showToast('Error loading barbers', 'error');
    } finally {
        showLoading(false);
    }
}

// Services
async function renderServices() {
    showLoading(true);

    try {
        const result = await DatabaseService.getServices(true);
        const container = elements.servicesList;

        if (container) {
            container.innerHTML = '';

            if (result.success) {
                result.data.forEach(service => {
                    // Obtener el nombre y descripción según el idioma
                    const name = service.nameEs && service.nameEn
                        ? (state.currentLanguage === 'es' ? service.nameEs : service.nameEn)
                        : service.name;
                    const desc = service.descEs && service.descEn
                        ? (state.currentLanguage === 'es' ? service.descEs : service.descEn)
                        : service.desc;

                    const serviceCard = document.createElement('div');
                    serviceCard.className = 'service-card';
                    serviceCard.innerHTML = `
        <img src="${service.img}" alt="${name}">
        <div class="service-card-content">
            <h3>${name}</h3>
            <p>${desc}</p>
            <div class="service-meta">
                <span>⏱️ ${service.duration} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</span>
                <span>$${service.price}</span>
            </div>
        </div>
    `;

                    serviceCard.addEventListener('click', () => {
                        showServiceDetails(service);
                    });

                    container.appendChild(serviceCard);
                });
            } else {
                showToast('Error loading services', 'error');
            }
        }
    } catch (error) {
        console.error("Error rendering services:", error);
        showToast('Error loading services', 'error');
    } finally {
        showLoading(false);
    }
}

function showServiceDetails(service) {
    const modal = document.getElementById('serviceModal');
    const content = document.getElementById('serviceModalContent');

    if (modal && content) {
        content.innerHTML = `
            <img src="${service.img}" alt="${service.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 5px; margin-bottom: 1rem;">
            <h2>${service.name}</h2>
            <p>${service.desc}</p>
            <div class="service-meta" style="margin-top: 1rem;">
                <span>⏱️ ${service.duration} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</span>
                <span>$${service.price}</span>
            </div>
        `;

        modal.classList.add('active');
    }
}

// Booking
function resetBookingData() {
    state.bookingData = {
        service: null,
        barber: null,
        date: null,
        time: null
    };
    state.currentBookingStep = 1;
}

function updateBookingStep() {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStepElement = document.getElementById(`step${state.currentBookingStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    // Actualizar navegación
    if (elements.prevStep) {
        elements.prevStep.disabled = state.currentBookingStep === 1;
    }

    if (elements.nextStep) {
        elements.nextStep.disabled = state.currentBookingStep === 4;

        // Cambiar texto según el paso
        if (state.currentBookingStep === 4) {
            elements.nextStep.textContent = translations[state.currentLanguage]['nav.appointments'] || 'My Appointments';
            elements.nextStep.style.display = 'none'; // 🔥 Ocultar en paso 4
        } else {
            elements.nextStep.textContent = translations[state.currentLanguage]['booking.next'] || 'Next';
            elements.nextStep.style.display = 'inline-block'; // 🔥 Mostrar en otros pasos
        }
    }

    // Mostrar/ocultar botón Confirmar
    if (elements.confirmBooking) {
        elements.confirmBooking.style.display = state.currentBookingStep === 4 ? 'block' : 'none';
    }

    // Render step content
    renderBookingStep();
}
async function renderBookingStep() {
    console.log('Rendering booking step:', state.currentBookingStep);

    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStepElement = document.getElementById(`step${state.currentBookingStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    // 🔥 CORRECCIÓN: Comportamiento consistente del botón Next
    if (elements.prevStep) {
        elements.prevStep.disabled = state.currentBookingStep === 1;
    }

    if (elements.nextStep) {
        elements.nextStep.disabled = state.currentBookingStep === 4;

        if (state.currentBookingStep === 4) {
            elements.nextStep.textContent = translations[state.currentLanguage]['nav.appointments'] || 'My Appointments';
            elements.nextStep.style.display = 'none'; // 🔥 Ocultar en paso 4
        } else {
            elements.nextStep.textContent = translations[state.currentLanguage]['booking.next'] || 'Next';
            elements.nextStep.style.display = 'inline-block'; // 🔥 Mostrar en otros pasos
        }
    }

    // 🔥 CORRECCIÓN: Mostrar botón Confirmar solo en paso 4
    if (elements.confirmBooking) {
        elements.confirmBooking.style.display = state.currentBookingStep === 4 ? 'block' : 'none';
    }

    // Render step content
    switch (state.currentBookingStep) {
        case 1:
            await BookingController.renderServiceSelection(state, elements);
            break;
        case 2:
            await BookingController.renderBarberSelection(state, elements);
            break;
        case 3:
            BookingController.renderDateTimeSelection(state, elements);
            break;
        case 4:
            BookingController.renderBookingSummary(state, elements);
            break;
    }
}
// Appointments
async function renderAppointments() {
    showLoading(true);

    try {
        const result = await DatabaseService.getAppointments({ clientId: state.currentUser.id });
        const servicesResult = await DatabaseService.getServices(true);
        const barbersResult = await DatabaseService.getBarbers(true);

        if (result.success && servicesResult.success && barbersResult.success) {
            const appointments = result.data;
            const services = servicesResult.data;
            const barbers = barbersResult.data;

            // Separar citas próximas y pasadas
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = appointments.filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= today && a.status !== 'canceled' && a.status !== 'completed';
            });

            const history = appointments.filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate < today || a.status === 'canceled' || a.status === 'completed';
            });

            // Renderizar citas próximas
            const upcomingContainer = document.getElementById('upcomingAppointments');
            if (upcomingContainer) {
                upcomingContainer.innerHTML = '';

                if (upcoming.length === 0) {
                    upcomingContainer.innerHTML = `<p>${translations[state.currentLanguage]['noUpcomingAppointments'] || 'No upcoming appointments'}</p>`;
                } else {
                    upcoming.sort((a, b) => {
                        const dateA = new Date(`${a.date} ${a.time}`);
                        const dateB = new Date(`${b.date} ${b.time}`);
                        return dateA - dateB;
                    });

                    upcoming.forEach(appointment => {
                        const service = services.find(s => s.id === appointment.service_id);
                        const barber = barbers.find(b => b.id === appointment.employee_id);

                        const card = document.createElement('div');
                        card.className = 'appointment-card';
                        card.innerHTML = `
                            <div class="appointment-header">
                                <h3>${service?.name || 'Service'}</h3>
                                <span class="appointment-status status-${appointment.status}">${translations[state.currentLanguage][`status.${appointment.status}`] || appointment.status}</span>
                            </div>
                            <div class="appointment-details">
                                <div>📅 ${formatDateDisplay(appointment.date)}</div>
                                <div>🕐 ${appointment.time}</div>
                                <div>👤 ${barber?.name || 'Barber'}</div>
                                <div>⏱️ ${service?.duration || 0} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</div>
                                <div>💰 $${service?.price || 0}</div>
                            </div>
                            <div class="appointment-actions">
                                <button class="btn btn-secondary" onclick="rescheduleAppointment('${appointment.id}')">${translations[state.currentLanguage]['appointments.reschedule'] || 'Reschedule'}</button>
                                <button class="btn btn-danger" onclick="cancelAppointment('${appointment.id}')">${translations[state.currentLanguage]['appointments.cancel'] || 'Cancel'}</button>
                            </div>
                        `;

                        upcomingContainer.appendChild(card);
                    });
                }
            }

            // Renderizar historial de citas
            const historyContainer = document.getElementById('appointmentHistory');
            if (historyContainer) {
                historyContainer.innerHTML = '';

                if (history.length === 0) {
                    historyContainer.innerHTML = `<p>${translations[state.currentLanguage]['noHistory'] || 'No appointment history'}</p>`;
                } else {
                    history.sort((a, b) => {
                        const dateA = new Date(`${a.date} ${a.time}`);
                        const dateB = new Date(`${b.date} ${b.time}`);
                        return dateB - dateA;
                    });

                    history.forEach(appointment => {
                        const service = services.find(s => s.id === appointment.service_id);
                        const barber = barbers.find(b => b.id === appointment.employee_id);

                        const card = document.createElement('div');
                        card.className = 'appointment-card';
                        card.innerHTML = `
                            <div class="appointment-header">
                                <h3>${service?.name || 'Service'}</h3>
                                <span class="appointment-status status-${appointment.status}">${translations[state.currentLanguage][`status.${appointment.status}`] || appointment.status}</span>
                            </div>
                            <div class="appointment-details">
                                <div>📅 ${formatDateDisplay(appointment.date)}</div>
                                <div>🕐 ${appointment.time}</div>
                                <div>👤 ${barber?.name || 'Barber'}</div>
                                <div>⏱️ ${service?.duration || 0} ${translations[state.currentLanguage]['booking.duration'] || 'min'}</div>
                                <div>💰 $${service?.price || 0}</div>
                            </div>
                        `;

                        // Añadir botón de valoración para citas completadas
                        if (appointment.status === 'completed' && !appointment.rated) {
                            card.innerHTML += `
                                <div class="appointment-actions">
                                    <button class="rating-btn" onclick="showRatingModal('${appointment.id}', '${service?.name || 'Service'}', '${barber?.name || 'Barber'}', '${barber?.id || ''}')">
                                        ${translations[state.currentLanguage]['rating.submit'] || 'Rate Service'}
                                    </button>
                                </div>
                            `;
                        }

                        historyContainer.appendChild(card);
                    });
                }
            }
        } else {
            showToast('Error loading appointments', 'error');
        }
    } catch (error) {
        console.error("Error rendering appointments:", error);
        showToast('Error loading appointments', 'error');
    } finally {
        showLoading(false);
    }
}

window.showRatingModal = function(appointmentId, serviceName, barberName, barberId) {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        // Set appointment data for rating
        modal.dataset.appointmentId = appointmentId;
        modal.dataset.serviceName = serviceName;
        modal.dataset.barberName = barberName;
        modal.dataset.barberId = barberId;
        modal.classList.add('active');
        
        // Initialize rating functionality
        initializeRatingModal();
    }
};
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
        const result = await DatabaseService.updateAppointment(appointmentId, { status: 'canceled' });

        if (result.success) {
            showToast(translations[state.currentLanguage]['appointmentCanceled'] || 'Appointment canceled', 'success');
            renderAppointments();
        } else {
            showToast('Error canceling appointment', 'error');
        }
    } catch (error) {
        console.error("Error canceling appointment:", error);
        showToast('Error canceling appointment', 'error');
    }
}


async function rescheduleAppointment(appointmentId) {
    try {
        // Obtener la cita actual
        const result = await DatabaseService.getAppointments({
            clientId: state.currentUser.id
        });

        if (result.success) {
            const appointment = result.data.find(a => a.id === appointmentId);

            if (appointment) {
                // Obtener servicios y barberos
                const servicesResult = await DatabaseService.getServices(true);
                const barbersResult = await DatabaseService.getBarbers(true);

                if (servicesResult.success && barbersResult.success) {
                    const services = servicesResult.data;
                    const barbers = barbersResult.data;

                    // 🔥 CORRECCIÓN: Resetear completamente los datos de booking
                    state.bookingData = {
                        service: null, // No preseleccionar servicio
                        barber: null,  // No preseleccionar barbero
                        date: null,
                        time: null,
                        originalAppointmentId: appointmentId // Guardar referencia
                    };

                    // 🔥 CORRECCIÓN: Empezar desde el paso 1 (selección de servicio)
                    state.currentBookingStep = 1;

                    // Ir a la página de reserva
                    showPage('bookAppointmentPage');
                    updateBookingStep();

                    showToast('Por favor selecciona un nuevo servicio, barbero, fecha y hora', 'info');
                }
            }
        }
    } catch (error) {
        console.error("Error al reprogramar cita:", error);
        showToast('Error al reprogramar cita', 'error');
    }
}
// Profile
async function renderProfile() {
    if (!state.currentUser) return;

    // Update profile form
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    const profilePhoneEl = document.getElementById('profilePhone');
    const notificationsEl = document.getElementById('notifications');

    if (profileNameEl) profileNameEl.value = state.currentUser.name;
    if (profileEmailEl) profileEmailEl.value = state.currentUser.email;
    if (profilePhoneEl) profilePhoneEl.value = state.currentUser.phone;
    if (notificationsEl) notificationsEl.checked = state.currentUser.push;

    // Update profile photo
    if (state.currentUser.photo && elements.profilePhoto) {
        elements.profilePhoto.src = state.currentUser.photo;
    }

    // Populate barber and service preferences
    const barbersResult = await DatabaseService.getBarbers(true);
    const servicesResult = await DatabaseService.getServices(true);

    if (barbersResult.success && servicesResult.success) {
        const barbers = barbersResult.data;
        const services = servicesResult.data;

        const prefBarberSelect = document.getElementById('prefBarber');
        if (prefBarberSelect) {
            prefBarberSelect.innerHTML = `<option value="">${translations[state.currentLanguage]['profile.noPreference'] || 'No Preference'}</option>`;

            barbers.forEach(barber => {
                const option = document.createElement('option');
                option.value = barber.id;
                option.textContent = barber.name;

                if (state.currentUser.prefBarber === barber.id) {
                    option.selected = true;
                }

                prefBarberSelect.appendChild(option);
            });
        }

        const prefServiceSelect = document.getElementById('prefService');
        if (prefServiceSelect) {
            prefServiceSelect.innerHTML = `<option value="">${translations[state.currentLanguage]['profile.noPreference'] || 'No Preference'}</option>`;

            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;

                if (state.currentUser.prefService === service.id) {
                    option.selected = true;
                }

                prefServiceSelect.appendChild(option);
            });
        }
    }

    // Render FAQ
    ProfileController.renderFAQ(state);
}

// Admin Dashboard
async function renderAdminDashboard() {
    // Render calendar by default
    AdminController.renderAdminCalendar(state, elements);

    // Render appointments
    AdminController.renderAdminAppointments(state, elements);

    // Render services
    AdminController.renderAdminServices(state, elements);

    // Render barbers
    AdminController.renderAdminBarbers(state, elements);

    // Render ratings
    AdminController.renderAdminRatings(state, elements);

    // Render statistics
    AdminController.renderAdminStats(state, elements);
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}Tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
}

// Real-time updates
function setupRealtimeAppointments() {
    if (!state.currentUser) return;

    // Escuchar cambios en las citas del cliente actual
    const unsubscribe = DatabaseService.onAppointmentsUpdate((appointments) => {
        // Filtrar citas del cliente actual
        const clientAppointments = appointments.filter(a => a.client_id === state.currentUser.id);

        // Actualizar la UI con las nuevas citas
        updateAppointmentsUI(clientAppointments);
    }, { clientId: state.currentUser.id });

    // Devolver función para cancelar la suscripción cuando se cambie de página
    return unsubscribe;
}

function updateAppointmentsUI(appointments) {
    // This function would update the appointments UI with new data
    // For simplicity, we'll just re-render the appointments
    if (state.currentPage === 'myAppointmentsPage') {
        renderAppointments();
    }
}

function logout() {
    state.currentUser = null;
    sessionStorage.removeItem('currentUser');
    showPage('loginPage');
    elements.bottomNav.classList.add('hidden');
    showToast('Logged out successfully', 'success');
}

// CORRECCIÓN: Añadir funciones globales para los eventos onclick en el HTML
window.rescheduleAppointment = rescheduleAppointment;
window.cancelAppointment = cancelAppointment;
window.updateAppointmentStatus = async function (appointmentId, newStatus) {
    try {
        const result = await DatabaseService.updateAppointment(appointmentId, { status: newStatus });

        if (result.success) {
            showToast(`Appointment ${newStatus}`, 'success');

            // Close modal if open
            const modal = document.getElementById('appointmentModal');
            if (modal) {
                modal.classList.remove('active');
            }

            // Refresh ALL admin views immediately
            AdminController.refreshAdminCalendar(state, elements);
            AdminController.renderAdminAppointments(state, elements);
            AdminController.renderAdminStats(state, elements);
            
            // Also refresh client appointments if user is viewing them
            if (state.currentPage === 'myAppointmentsPage') {
                renderAppointments();
            }
        } else {
            showToast('Error updating appointment', 'error');
        }
    } catch (error) {
        console.error("Error updating appointment:", error);
        showToast('Error updating appointment', 'error');
    }
};

window.editService = function (serviceId) {
    showToast('Edit service functionality not implemented in this demo', 'warning');
};

window.toggleServiceStatus = async function (serviceId) {
    try {
        const servicesResult = await DatabaseService.getServices();

        if (servicesResult.success) {
            const services = servicesResult.data;
            const service = services.find(s => s.id === serviceId);

            if (service) {
                const result = await DatabaseService.updateService(serviceId, { active: !service.active });

                if (result.success) {
                    showToast(service.active ? translations[state.currentLanguage]['serviceDeactivated'] || 'Service deactivated' : translations[state.currentLanguage]['serviceActivated'] || 'Service activated', 'success');
                    AdminController.renderAdminServices(state, elements);
                } else {
                    showToast('Error updating service', 'error');
                }
            }
        }
    } catch (error) {
        console.error("Error toggling service status:", error);
        showToast('Error updating service', 'error');
    }
};

window.deleteService = async function (serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
        // Usar el método deleteService que hemos añadido
        const result = await DatabaseService.deleteService(serviceId);

        if (result.success) {
            showToast(translations[state.currentLanguage]['serviceDeleted'] || 'Service deleted successfully', 'success');
            AdminController.renderAdminServices(state, elements);
        } else {
            showToast('Error deleting service', 'error');
        }
    } catch (error) {
        console.error("Error deleting service:", error);
        showToast('Error deleting service', 'error');
    }
};

window.editBarber = function (barberId) {
    showToast('Edit barber functionality not implemented in this demo', 'warning');
};

window.toggleBarberStatus = async function (barberId) {
    try {
        const barbersResult = await DatabaseService.getBarbers();

        if (barbersResult.success) {
            const barbers = barbersResult.data;
            const barber = barbers.find(b => b.id === barberId);

            if (barber) {
                const result = await DatabaseService.updateBarber(barberId, { active: !barber.active });

                if (result.success) {
                    showToast(barber.active ? translations[state.currentLanguage]['barberDeactivated'] || 'Barber deactivated' : translations[state.currentLanguage]['barberActivated'] || 'Barber activated', 'success');
                    AdminController.renderAdminBarbers(state, elements);
                    renderBarbers(); // Also update the home page barbers
                } else {
                    showToast('Error updating barber', 'error');
                }
            }
        }
    } catch (error) {
        console.error("Error toggling barber status:", error);
        showToast('Error updating barber', 'error');
    }
};

// Modal functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Rating functionality
function initializeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (!modal) return;

    const appointmentId = modal.dataset.appointmentId;
    const serviceName = modal.dataset.serviceName;
    const barberName = modal.dataset.barberName;
    
    let barberRating = 0;
    let appRating = 0;

    // Función para resetear estrellas
    function resetStars(containerId) {
        document.querySelectorAll(`${containerId} .star`).forEach(star => {
            star.style.color = '#ccc'; // Gray
            star.style.textShadow = 'none';
            star.style.transform = 'scale(1)';
            star.style.filter = 'none';
            star.classList.remove('selected');
        });
    }

    // Resetear todas las estrellas al abrir el modal
    resetStars('#barberStars');
    resetStars('#appStars');
    
    const commentInput = document.getElementById('ratingComment');
    const charCount = document.getElementById('charCount');
    if (commentInput) commentInput.value = '';
    if (charCount) charCount.textContent = '0/100';

    // Barber stars handlers - MÉTODO CORREGIDO
    document.querySelectorAll('#barberStars .star').forEach(star => {
        star.onclick = () => {
            barberRating = parseInt(star.dataset.value);
            console.log(`Barber rating set to: ${barberRating}`);
            
            // Small delay to ensure visual feedback
            setTimeout(() => {
                updateStars('#barberStars', barberRating);
                checkEnableSubmit();
            }, 50);
        };
    });

    // App stars handlers - MÉTODO CORREGIDO
    document.querySelectorAll('#appStars .star').forEach(star => {
        star.onclick = () => {
            appRating = parseInt(star.dataset.value);
            console.log(`App rating set to: ${appRating}`);
            
            // Small delay to ensure visual feedback
            setTimeout(() => {
                updateStars('#appStars', appRating);
                checkEnableSubmit();
            }, 50);
        };
    });

    function updateStars(containerId, rating) {
        console.log(`Updating ${containerId} with rating: ${rating}`);
        
        // Directly set colors to ensure they stay yellow
        document.querySelectorAll(`${containerId} .star`).forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffd700'; // Gold/Yellow
                star.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.8)';
                star.style.transform = 'scale(1.1)';
                star.style.filter = 'brightness(1.2)';
                star.classList.add('selected');
                console.log(`Star ${index + 1}: YELLOW (SELECTED)`);
            } else {
                star.style.color = '#ccc'; // Gray
                star.style.textShadow = 'none';
                star.style.transform = 'scale(1)';
                star.style.filter = 'none';
                star.classList.remove('selected');
                console.log(`Star ${index + 1}: GRAY`);
            }
        });
    }

    function checkEnableSubmit() {
        const submitBtn = document.getElementById('submitRatingBtn');
        if (submitBtn) {
            submitBtn.disabled = !(barberRating > 0 && appRating > 0);
            console.log('Submit button enabled:', !submitBtn.disabled);
        }
    }

    // Comment character count
    if (commentInput && charCount) {
        commentInput.addEventListener('input', () => {
            const count = commentInput.value.length;
            charCount.textContent = `${count}/100`;
        });
    }

    // Submit button handler
    const submitBtn = document.getElementById('submitRatingBtn');
    if (submitBtn) {
        submitBtn.onclick = async () => {
            try {
                console.log('Submitting rating:', { barberRating, appRating });

                if (!barberRating || !appRating) {
                    showToast('Please rate both the barber and the app', 'error');
                    return;
                }

                const result = await DatabaseService.submitRating({
                    appointmentId: appointmentId,
                    barberRating: barberRating,
                    appRating: appRating,
                    comment: commentInput ? commentInput.value.trim() : '',
                    barberId: modal.dataset.barberId || '',
                    userId: state.currentUser.id
                });

                if (result.success) {
                    showToast(translations[state.currentLanguage]['rating.success'] || 'Rating submitted successfully', 'success');
                    closeModal('ratingModal');
                    renderAppointments();
                } else {
                    showToast(result.error || 'Error submitting rating', 'error');
                }
            } catch (error) {
                console.error('Error submitting rating:', error);
                showToast('Error submitting rating', 'error');
            }
        };
    }

    // Close modal handlers
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => closeModal('ratingModal');
    }

    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal('ratingModal');
        }
    };
}

// Export functions for use in other modules
export {
    state,
    elements,
    showPage,
    showUserInterface,
    updateNavigation,
    setLanguage,
    toggleLanguage,
    setTheme,
    toggleTheme,
    renderHomePage,
    renderBarbers,
    renderServices,
    showServiceDetails,
    resetBookingData,
    updateBookingStep,
    renderBookingStep,
    renderAppointments,
    cancelAppointment,
    rescheduleAppointment,
    renderProfile,
    renderAdminDashboard,
    showTab,
    setupRealtimeAppointments,
    updateAppointmentsUI,
    logout,
    closeModal,
    initializeRatingModal
};

// DEBUG: Verificar estado del botón Next
setTimeout(() => {
    const nextBtn = document.getElementById('nextStep');
    if (nextBtn) {
        console.log('Next button state:', {
            disabled: nextBtn.disabled,
            text: nextBtn.textContent,
            step: state.currentBookingStep
        });
    }
}, 100);

// Añade esta función en js/app.js
function resetBookingAfterConfirmation() {
    console.log('Resetting booking data after confirmation...');
    state.bookingData = {
        service: null,
        barber: null,
        date: null,
        time: null,
        originalAppointmentId: null
    };
    state.currentBookingStep = 1;

    // También resetear la UI
    if (elements.nextStep) {
        elements.nextStep.style.display = 'inline-block';
        elements.nextStep.disabled = false;
        elements.nextStep.textContent = translations[state.currentLanguage]['booking.next'] || 'Next';
    }
    if (elements.confirmBooking) {
        elements.confirmBooking.style.display = 'none';
    }
}