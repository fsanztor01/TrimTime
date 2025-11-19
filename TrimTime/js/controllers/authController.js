// js/controllers/authController.js
import { DatabaseService } from '../services/databaseService.js';
import { translations } from '../services/translation.js';
import { generateId } from '../utils/constants.js';
import { showToast } from '../utils/uiUtils.js';

export class AuthController {
    static setupEventListeners(state, elements, { showPage, showUserInterface, setLanguage }) {
        console.log('Setting up auth controller event listeners...');

        // Auth forms - VERIFICAR QUE EXISTEN LOS ELEMENTOS
        if (elements.loginForm) {
            console.log('Login form found, adding submit listener');
            elements.loginForm.addEventListener('submit', (e) => AuthController.handleLogin(e, state, { showUserInterface, setLanguage }));
        } else {
            console.error('Login form not found!');
        }

        if (elements.registerForm) {
            console.log('Register form found, adding submit listener');
            elements.registerForm.addEventListener('submit', (e) => AuthController.handleRegister(e, state, { showUserInterface }));
        } else {
            console.error('Register form not found!');
        }

        if (elements.showRegister) {
            elements.showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                showPage('registerPage');
            });
        }

        if (elements.showLogin) {
            elements.showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                showPage('loginPage');
            });
        }
    }

    static async handleLogin(e, state, { showUserInterface, setLanguage }) {
        e.preventDefault();
        console.log('Login form submitted');

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Login attempt with email:', email);

        // Credenciales de administrador para pruebas
        if (email === 'admin@trimtime.com' && password === 'admin123') {
            console.log('Admin login detected');
            // Obtener usuario de administrador de localStorage
            const usersResult = await DatabaseService.getUsers();

            if (usersResult.success) {
                const adminUser = usersResult.data.find(u => u.email === email);

                if (adminUser) {
                    state.currentUser = adminUser;
                    sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                    showToast('Admin login successful!', 'success');
                    showUserInterface();
                    return;
                }
            }
        }

        // Intentar autenticar con usuarios locales
        const usersResult = await DatabaseService.getUsers();

        if (usersResult.success) {
            const user = usersResult.data.find(u => u.email === email);

            if (user) {
                // En una implementación real, verificaríamos la contraseña aquí
                // Para esta simulación, simplemente verificamos que el usuario exista
                state.currentUser = user;
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));

                // Establecer idioma preferido
                if (state.currentUser.lang) {
                    setLanguage(state.currentUser.lang);
                }

                showToast('Login successful!', 'success');
                showUserInterface();
            } else {
                showToast('Invalid email or password', 'error');
            }
        } else {
            showToast('Error loading users', 'error');
        }
    }

    static async handleLogin(e, state, { showUserInterface, setLanguage }) {
    e.preventDefault();
    console.log('Login form submitted');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    // Permitir excepción para el administrador
    const isAdmin = email === 'admin@trimtime.com' && password === 'admin123';

    // === Validación del email solo si NO es admin ===
    if (!isAdmin) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            showToast('Por favor usa un correo válido de Gmail (ej: usuario@gmail.com)', 'error');
            return;
        }

        // === Validación de contraseña solo si NO es admin ===
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            showToast('La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y un símbolo.', 'error');
            return;
        }
    }

    console.log('Login attempt with email:', email);

    // === Modo administrador (acceso directo) ===
    if (isAdmin) {
        console.log('Admin login detected');
        const usersResult = await DatabaseService.getUsers();

        if (usersResult.success) {
            const adminUser = usersResult.data.find(u => u.email === email);

            // Si ya existe, iniciar sesión con él
            if (adminUser) {
                state.currentUser = adminUser;
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                showToast('Inicio de sesión como administrador exitoso', 'success');
                showUserInterface();
                return;
            } else {
                // Si no existe, crearlo automáticamente (opcional)
                const newAdmin = {
                    id: generateId(),
                    email,
                    role: 'admin',
                    name: 'Administrador',
                    phone: '',
                    lang: 'es',
                    photo: 'https://i.imgur.com/hmYb0aM.png',
                    prefBarber: '',
                    prefService: '',
                    push: false
                };
                await DatabaseService.saveUser(newAdmin);
                state.currentUser = newAdmin;
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                showToast('Administrador creado e iniciado correctamente', 'success');
                showUserInterface();
                return;
            }
        }
    }

    // === Autenticación normal ===
    const usersResult = await DatabaseService.getUsers();

    if (usersResult.success) {
        const user = usersResult.data.find(u => u.email === email);

        if (user) {
            state.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));

            if (state.currentUser.lang) setLanguage(state.currentUser.lang);

            showToast('Inicio de sesión exitoso', 'success');
            showUserInterface();
        } else {
            showToast('Correo o contraseña incorrectos', 'error');
        }
    } else {
        showToast('Error cargando usuarios', 'error');
    }
}



    static async handleRegister(e, state, { showUserInterface }) {
        e.preventDefault();
        console.log('Register form submitted');

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const role = 'client';

        // === Validación del email ===
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            showToast('Por favor usa un correo válido de Gmail (ej: usuario@gmail.com)', 'error');
            return;
        }

        // === Validación de contraseña ===
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            showToast('La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y un símbolo.', 'error');
            return;
        }

        const usersResult = await DatabaseService.getUsers();

        if (usersResult.success) {
            const existingUser = usersResult.data.find(u => u.email === email);
            if (existingUser) {
                showToast('Este correo ya está registrado', 'error');
                return;
            }

            const newUser = {
                id: generateId(),
                email,
                role,
                name,
                phone,
                lang: state.currentLanguage,
                photo: `https://picsum.photos/seed/${email}/150/150.jpg`,
                prefBarber: '',
                prefService: '',
                push: true
            };

            const result = await DatabaseService.saveUser(newUser);

            if (result.success) {
                state.currentUser = newUser;
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                showToast('¡Registro exitoso! Bienvenido a Trim Time.', 'success');
                showUserInterface();
            } else {
                showToast('Error guardando el usuario', 'error');
            }
        } else {
            showToast('Error cargando usuarios', 'error');
        }
    }

}