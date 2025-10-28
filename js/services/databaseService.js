// js/services/databaseService.js
// Database Service Class - Versión Local
import { generateId } from '../utils/constants.js';

export class DatabaseService {
    // Inicializar datos por defecto si no existen
    static initializeData() {
        if (!localStorage.getItem('users')) {
            const defaultUsers = [
                {
                    id: 'admin-test',
                    email: 'admin@trimtime.com',
                    role: 'admin',
                    name: 'Admin User',
                    phone: '1234567890',
                    lang: 'en',
                    photo: 'https://picsum.photos/seed/admin/150/150.jpg',
                    prefBarber: '',
                    prefService: '',
                    push: true
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('services')) {
            // Obtener idioma actual o usar inglés como predeterminado
            const currentLanguage = localStorage.getItem('language') || 'en';

            const defaultServices = [
                {
                    id: 'service-1',
                    name: currentLanguage === 'es' ? 'Corte de Pelo Clásico' : 'Classic Haircut',
                    nameEn: 'Classic Haircut',
                    nameEs: 'Corte de Pelo Clásico',
                    duration: 30,
                    price: 25,
                    desc: currentLanguage === 'es'
                        ? 'Un corte de pelo clásico con tijeras y maquinilla, perfecto para mantener tu estilo.'
                        : 'A classic haircut with scissors and clippers, perfect for maintaining your style.',
                    descEn: 'A classic haircut with scissors and clippers, perfect for maintaining your style.',
                    descEs: 'Un corte de pelo clásico con tijeras y maquinilla, perfecto para mantener tu estilo.',
                    img: 'images/Fade.jpg',
                    active: true
                },
                {
                    id: 'service-2',
                    name: currentLanguage === 'es' ? 'Recorte de Barba' : 'Beard Trim',
                    nameEn: 'Beard Trim',
                    nameEs: 'Recorte de Barba',
                    duration: 20,
                    price: 15,
                    desc: currentLanguage === 'es'
                        ? 'Recorte y perfilado profesional de barba para mantenerte impecable.'
                        : 'Professional beard trimming and shaping to keep you looking sharp.',
                    descEn: 'Professional beard trimming and shaping to keep you looking sharp.',
                    descEs: 'Recorte y perfilado profesional de barba para mantenerte impecable.',
                    img: 'images/BeardTrim.png',
                    active: true
                },
                {
                    id: 'service-3',
                    name: currentLanguage === 'es' ? 'Afeitado con Toalla Caliente' : 'Hot Towel Shave',
                    nameEn: 'Hot Towel Shave',
                    nameEs: 'Afeitado con Toalla Caliente',
                    duration: 45,
                    price: 35,
                    desc: currentLanguage === 'es'
                        ? 'Relajante afeitado con toalla caliente y productos premium para el afeitado más cercano.'
                        : 'Relaxing hot towel shave with premium products for the closest shave.',
                    descEn: 'Relaxing hot towel shave with premium products for the closest shave.',
                    descEs: 'Relajante afeitado con toalla caliente y productos premium para el afeitado más cercano.',
                    img: 'images/HotTowelService.jpg',
                    active: true
                },
                {
                    id: 'service-4',
                    name: currentLanguage === 'es' ? 'Corte y Barba' : 'Haircut & Beard',
                    nameEn: 'Haircut & Beard',
                    nameEs: 'Corte y Barba',
                    duration: 50,
                    price: 40,
                    desc: currentLanguage === 'es'
                        ? 'Paquete de cuidado completo con corte de pelo y recorte de barba.'
                        : 'Complete grooming package with haircut and beard trim.',
                    descEn: 'Complete grooming package with haircut and beard trim.',
                    descEs: 'Paquete de cuidado completo con corte de pelo y recorte de barba.',
                    img: 'images/Haircut.jpg',
                    active: true
                }
            ];
            localStorage.setItem('services', JSON.stringify(defaultServices));
        }

        if (!localStorage.getItem('barbers')) {
            const currentLanguage = localStorage.getItem('language') || 'en';

            const defaultBarbers = [
                {
                    id: 'barber-1',
                    name: currentLanguage === 'es' ? 'Juan García' : 'John Smith',
                    nameEn: 'John Smith',
                    nameEs: 'Juan García',
                    days: '1-5',
                    hours: '09:00-17:00',
                    active: true,
                    rating: 4.5,
                    photo: 'https://picsum.photos/seed/john/200/200.jpg'
                },
                {
                    id: 'barber-2',
                    name: currentLanguage === 'es' ? 'Miguel Johnson' : 'Mike Johnson',
                    nameEn: 'Mike Johnson',
                    nameEs: 'Miguel Johnson',
                    days: '2-6',
                    hours: '10:00-18:00',
                    active: true,
                    rating: 4.8,
                    photo: 'https://picsum.photos/seed/mike/200/200.jpg'
                },
                {
                    id: 'barber-3',
                    name: currentLanguage === 'es' ? 'David Wilson' : 'David Wilson',
                    nameEn: 'David Wilson',
                    nameEs: 'David Wilson',
                    days: '1-3,5',
                    hours: '08:00-16:00',
                    active: true,
                    rating: 4.2,
                    photo: 'https://picsum.photos/seed/david/200/200.jpg'
                }
            ];
            localStorage.setItem('barbers', JSON.stringify(defaultBarbers));
        }

        if (!localStorage.getItem('appointments')) {
            localStorage.setItem('appointments', JSON.stringify([]));
        }
    }

    // Nuevo método para actualizar servicios cuando cambia el idioma
    // Reemplaza el método updateServicesLanguage con esta versión mejorada
    static updateServicesLanguage(language) {
        const services = JSON.parse(localStorage.getItem('services')) || [];

        // Actualizar todos los servicios, no solo los predeterminados
        const updatedServices = services.map(service => {
            // Si el servicio ya tiene campos de traducción, solo actualizamos el campo visible
            if (service.nameEn && service.nameEs) {
                return {
                    ...service,
                    name: language === 'es' ? service.nameEs : service.nameEn,
                    desc: language === 'es' ? service.descEs : service.descEn
                };
            }
            // Si no tiene campos de traducción, los creamos
            else {
                return {
                    ...service,
                    nameEn: service.nameEn || service.name,
                    nameEs: service.nameEs || service.name,
                    descEn: service.descEn || service.desc,
                    descEs: service.descEs || service.desc,
                    name: language === 'es' ? (service.nameEs || service.name) : (service.nameEn || service.name),
                    desc: language === 'es' ? (service.descEs || service.desc) : (service.descEn || service.desc)
                };
            }
        });

        localStorage.setItem('services', JSON.stringify(updatedServices));
    }

    // Nuevo método para actualizar barberos cuando cambia el idioma
    static updateBarbersLanguage(language) {
        const barbers = JSON.parse(localStorage.getItem('barbers')) || [];

        const translatedBarbers = [
            {
                id: 'barber-1',
                name: 'John Smith',
                days: '1-5',
                hours: '09:00-17:00',
                active: true,
                rating: 4.5,
                photo: 'https://picsum.photos/seed/john/200/200.jpg'
            },
            {
                id: 'barber-2',
                name: 'Mike Johnson',
                days: '2-6',
                hours: '10:00-18:00',
                active: true,
                rating: 4.8,
                photo: 'https://picsum.photos/seed/mike/200/200.jpg'
            },
            {
                id: 'barber-3',
                name: 'David Wilson',
                days: '1-3,5',
                hours: '08:00-16:00',
                active: true,
                rating: 4.2,
                photo: 'https://picsum.photos/seed/david/200/200.jpg'
            }
        ];

        // Actualizar solo los barberos predeterminados, mantener los barberos personalizados
        const updatedBarbers = barbers.map(barber => {
            const translatedBarber = translatedBarbers.find(tb => tb.id === barber.id);
            if (translatedBarber) {
                return {
                    ...barber,
                    name: translatedBarber.name
                };
            }
            return barber;
        });

        localStorage.setItem('barbers', JSON.stringify(updatedBarbers));
    }

    // Usuarios
    static async saveUser(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const existingIndex = users.findIndex(u => u.id === userData.id);

            if (existingIndex !== -1) {
                users[existingIndex] = {
                    ...userData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                users.push({
                    ...userData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('users', JSON.stringify(users));
            return { success: true };
        } catch (error) {
            console.error("Error saving user:", error);
            return { success: false, error: error.message };
        }
    }

    static async getUser(userId) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.id === userId);

            if (user) {
                return { success: true, data: user };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.error("Error getting user:", error);
            return { success: false, error: error.message };
        }
    }

    static async updateUser(userId, userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    ...userData,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('users', JSON.stringify(users));
                return { success: true };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, error: error.message };
        }
    }

    // Citas
    static async saveAppointment(appointmentData) {
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const existingIndex = appointments.findIndex(a => a.id === appointmentData.id);

            if (existingIndex !== -1) {
                appointments[existingIndex] = {
                    ...appointmentData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                appointments.push({
                    ...appointmentData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('appointments', JSON.stringify(appointments));
            return { success: true };
        } catch (error) {
            console.error("Error saving appointment:", error);
            return { success: false, error: error.message };
        }
    }

    static async getAppointments(filters = {}) {
        try {
            let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

            if (filters.clientId) {
                appointments = appointments.filter(a => a.client_id === filters.clientId);
            }

            if (filters.status) {
                appointments = appointments.filter(a => a.status === filters.status);
            }

            // MEJORA: Filtro de fecha mejorado para que funcione correctamente
            if (filters.dateFrom) {
                appointments = appointments.filter(a => a.date >= filters.dateFrom);
            }

            if (filters.dateTo) {
                appointments = appointments.filter(a => a.date <= filters.dateTo);
            }

            appointments.sort((a, b) => {
                const dateA = new Date(`${a.date} ${a.time}`);
                const dateB = new Date(`${b.date} ${b.time}`);
                return dateB - dateA;
            });

            return { success: true, data: appointments };
        } catch (error) {
            console.error("Error getting appointments:", error);
            return { success: false, error: error.message };
        }
    }
    static async updateAppointment(id, updatedData) {
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const index = appointments.findIndex(a => a.id === id);

            if (index !== -1) {
                appointments[index] = {
                    ...appointments[index],
                    ...updatedData
                };
                localStorage.setItem('appointments', JSON.stringify(appointments)); // 🔹 Guardar cambios
                return { success: true, data: appointments[index] };
            } else {
                console.warn('No appointment found with ID:', id);
                return { success: false, error: 'Appointment not found' };
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            return { success: false, error };
        }
    }

    // Servicios
    static async saveService(serviceData) {
        try {
            const services = JSON.parse(localStorage.getItem('services')) || [];
            const existingIndex = services.findIndex(s => s.id === serviceData.id);

            if (existingIndex !== -1) {
                services[existingIndex] = {
                    ...serviceData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                services.push({
                    ...serviceData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('services', JSON.stringify(services));
            return { success: true };
        } catch (error) {
            console.error("Error saving service:", error);
            return { success: false, error: error.message };
        }
    }

    static async getServices(activeOnly = false) {
        try {
            let services = JSON.parse(localStorage.getItem('services')) || [];

            if (activeOnly) {
                services = services.filter(s => s.active);
            }

            return { success: true, data: services };
        } catch (error) {
            console.error("Error getting services:", error);
            return { success: false, error: error.message };
        }
    }

    static async updateService(serviceId, serviceData) {
        try {
            const services = JSON.parse(localStorage.getItem('services')) || [];
            const serviceIndex = services.findIndex(s => s.id === serviceId);

            if (serviceIndex !== -1) {
                services[serviceIndex] = {
                    ...services[serviceIndex],
                    ...serviceData,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('services', JSON.stringify(services));
                return { success: true };
            } else {
                return { success: false, error: "Service not found" };
            }
        } catch (error) {
            console.error("Error updating service:", error);
            return { success: false, error: error.message };
        }
    }

    static async deleteService(serviceId) {
        try {
            const services = JSON.parse(localStorage.getItem('services')) || [];
            const filteredServices = services.filter(s => s.id !== serviceId);

            if (services.length !== filteredServices.length) {
                localStorage.setItem('services', JSON.stringify(filteredServices));
                return { success: true };
            } else {
                return { success: false, error: "Service not found" };
            }
        } catch (error) {
            console.error("Error deleting service:", error);
            return { success: false, error: error.message };
        }
    }

    // Barberos
    static async saveBarber(barberData) {
        try {
            const barbers = JSON.parse(localStorage.getItem('barbers')) || [];
            const existingIndex = barbers.findIndex(b => b.id === barberData.id);

            if (existingIndex !== -1) {
                barbers[existingIndex] = {
                    ...barberData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                barbers.push({
                    ...barberData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            localStorage.setItem('barbers', JSON.stringify(barbers));
            return { success: true };
        } catch (error) {
            console.error("Error saving barber:", error);
            return { success: false, error: error.message };
        }
    }

    static async getBarbers(activeOnly = false) {
        try {
            let barbers = JSON.parse(localStorage.getItem('barbers')) || [];

            if (activeOnly) {
                barbers = barbers.filter(b => b.active);
            }

            return { success: true, data: barbers };
        } catch (error) {
            console.error("Error getting barbers:", error);
            return { success: false, error: error.message };
        }
    }

    static async updateBarber(barberId, barberData) {
        try {
            const barbers = JSON.parse(localStorage.getItem('barbers')) || [];
            const barberIndex = barbers.findIndex(b => b.id === barberId);

            if (barberIndex !== -1) {
                barbers[barberIndex] = {
                    ...barbers[barberIndex],
                    ...barberData,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('barbers', JSON.stringify(barbers));
                return { success: true };
            } else {
                return { success: false, error: "Barber not found" };
            }
        } catch (error) {
            console.error("Error updating barber:", error);
            return { success: false, error: error.message };
        }
    }

    static async getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            return { success: true, data: users };
        } catch (error) {
            console.error("Error getting users:", error);
            return { success: false, error: error.message };
        }
    }

    static async getStatistics(filters = {}) {
        try {
            // MEJORA: Aplicar filtros de fecha correctamente
            const appointmentsResult = await this.getAppointments({
                dateFrom: filters.from,
                dateTo: filters.to
            });

            if (!appointmentsResult.success) {
                return { success: false, error: appointmentsResult.error };
            }

            const appointments = appointmentsResult.data;

            // Calcular estadísticas
            const totalAppointments = appointments.length;
            const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
            const completedAppointments = appointments.filter(a => a.status === 'completed').length;
            const canceledAppointments = appointments.filter(a => a.status === 'canceled').length;
            const cancellationRate = totalAppointments > 0 ? (canceledAppointments / totalAppointments * 100).toFixed(1) : 0;

            // Calcular ingresos totales
            const servicesResult = await this.getServices();
            let totalRevenue = 0;

            if (servicesResult.success) {
                const services = servicesResult.data;

                appointments.forEach(appointment => {
                    if (appointment.status === 'completed') {
                        const service = services.find(s => s.id === appointment.service_id);
                        if (service) {
                            totalRevenue += service.price;
                        }
                    }
                });
            }

            // Calcular servicios más populares
            const serviceCounts = {};
            appointments.forEach(appointment => {
                if (appointment.status === 'completed') {
                    serviceCounts[appointment.service_id] = (serviceCounts[appointment.service_id] || 0) + 1;
                }
            });

            const topServices = Object.entries(serviceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([serviceId, count]) => ({ serviceId, count }));

            // Calcular horas pico
            const hourCounts = {};
            appointments.forEach(appointment => {
                if (appointment.status === 'completed') {
                    const hour = parseInt(appointment.time.split(':')[0]);
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            });

            const peakHours = Object.entries(hourCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([hour, count]) => ({ hour: parseInt(hour), count }));

            return {
                success: true,
                data: {
                    totalAppointments,
                    confirmedAppointments,
                    completedAppointments,
                    canceledAppointments,
                    cancellationRate,
                    totalRevenue,
                    topServices,
                    peakHours
                }
            };
        } catch (error) {
            console.error("Error getting statistics:", error);
            return { success: false, error: error.message };
        }
    }

    // Simulación de actualizaciones en tiempo real
    static onAppointmentsUpdate(callback, filters = {}) {
        // En una implementación real, esto usaría WebSockets o similar
        // Para esta simulación, simplemente devolvemos una función que no hace nada
        return () => { };
    }

    static async getAppointment(appointmentId) {
        try {
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const appointment = appointments.find(a => a.id === appointmentId);

            if (appointment) {
                return { success: true, data: appointment };
            } else {
                return { success: false, error: "Appointment not found" };
            }
        } catch (error) {
            console.error("Error getting appointment:", error);
            return { success: false, error: error.message };
        }
    }

    static async saveRating(ratingData) {
        try {
            const ratings = JSON.parse(localStorage.getItem('ratings')) || [];
            ratings.push({ ...ratingData, id: generateId() });
            localStorage.setItem('ratings', JSON.stringify(ratings));
            return { success: true };
        } catch (error) {
            console.error('Error saving rating:', error);
            return { success: false, error: 'Error saving rating' };
        }
    }

    static async submitRating(ratingData) {
        try {
            // Save the rating
            const ratingResult = await this.saveRating(ratingData);
            
            if (ratingResult.success) {
                // Update the appointment to mark it as rated
                const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
                const appointmentIndex = appointments.findIndex(a => a.id === ratingData.appointmentId);
                
                if (appointmentIndex !== -1) {
                    appointments[appointmentIndex].rated = true;
                    localStorage.setItem('appointments', JSON.stringify(appointments));
                }
                
                // Update barber rating
                const barbers = JSON.parse(localStorage.getItem('barbers')) || [];
                const barberIndex = barbers.findIndex(b => b.id === ratingData.barberId);
                
                if (barberIndex !== -1) {
                    const barberRatings = await this.getRatings(ratingData.barberId);
                    const newRating = barberRatings.length > 0 
                        ? barberRatings.reduce((sum, rating) => sum + rating, 0) / barberRatings.length
                        : 0;
                    
                    barbers[barberIndex].rating = Math.round(newRating * 10) / 10;
                    localStorage.setItem('barbers', JSON.stringify(barbers));
                }
                
                return { success: true };
            }
            
            return ratingResult;
        } catch (error) {
            console.error('Error submitting rating:', error);
            return { success: false, error: 'Error submitting rating' };
        }
    }

    static async getRatings(barberId) {
        try {
            const ratings = JSON.parse(localStorage.getItem('ratings')) || [];
            return ratings
                .filter(r => r.barberId === barberId)
                .map(r => r.barberRating);
        } catch (error) {
            console.error('Error getting ratings:', error);
            return [];
        }
    }

    static async getAllRatings() {
        try {
            return JSON.parse(localStorage.getItem('ratings')) || [];
        } catch (error) {
            console.error('Error getting all ratings:', error);
            return [];
        }
    }
}
