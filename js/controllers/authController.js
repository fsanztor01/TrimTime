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

    static async handleRegister(e, state, { showUserInterface }) {
        e.preventDefault();
        console.log('Register form submitted');

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        console.log('Registration attempt:', { name, email, role });

        // Verificar si el correo ya está registrado
        const usersResult = await DatabaseService.getUsers();

        if (usersResult.success) {
            const existingUser = usersResult.data.find(u => u.email === email);

            if (existingUser) {
                showToast('Email already registered', 'error');
                return;
            }

            // Crear nuevo usuario
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

                showToast('Registration successful! Welcome to Trim Time!', 'success');
                showUserInterface();
            } else {
                showToast('Error saving user data', 'error');
            }
        } else {
            showToast('Error loading users', 'error');
        }
    }
}