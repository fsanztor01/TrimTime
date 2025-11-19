// js/config/appConfig.js
export const appConfig = {
    appName: 'Trim Time',
    version: '1.0.0',
    apiUrl: 'https://api.trimtime.com',
    defaultLanguage: 'en',
    defaultTheme: 'dark',
    bookingTimeSlotDuration: 30, // minutes
    maxBookingDaysInAdvance: 30,
    workingHours: {
        start: '09:00',
        end: '18:00'
    },
    closedDays: [0], // 0 = Sunday
    supportedLanguages: ['en', 'es'],
    supportedThemes: ['dark', 'light']
};