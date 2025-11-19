// js/utils/dateUtils.js
export function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

export function formatDays(daysStr) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (daysStr.includes('-')) {
        const [start, end] = daysStr.split('-').map(d => parseInt(d));
        return days.slice(start - 1, end).join(', ');
    } else if (daysStr.includes(',')) {
        return daysStr.split(',').map(d => days[parseInt(d) - 1]).join(', ');
    } else {
        return days[parseInt(daysStr) - 1];
    }
}

export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export function isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

export function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(time);
        }
    }
    return slots;
}

export function isTimeSlotAvailable(dateStr, time, barberId, existingAppointments = [], ignoreAppointmentId = null) {
    if (!dateStr || !time || !barberId) return false;

    // Check if there's an appointment at the same time with the same barber
    const conflictingAppointment = existingAppointments.find(a => {
        // Ignorar la cita original si estamos reprogramando
        if (ignoreAppointmentId && a.id === ignoreAppointmentId) return false;

        if (a.date !== dateStr || a.employee_id !== barberId) return false;
        if (a.status === 'canceled' || a.status === 'rescheduling') return false;

        // Parse times
        const [existingHour, existingMinute] = a.time.split(':').map(Number);
        const [newHour, newMinute] = time.split(':').map(Number);

        // Convert to minutes
        const existingStart = existingHour * 60 + existingMinute;
        const existingEnd = existingStart + (a.duration || 30); // Default duration if not specified
        const newStart = newHour * 60 + newMinute;

        // Check if new appointment starts during existing appointment
        return newStart >= existingStart && newStart < existingEnd;
    });

    return !conflictingAppointment;
}

export function getStatusColor(status) {
    switch (status) {
        case 'pending':
            return '#FF9800';
        case 'confirmed':
            return '#4CAF50';
        case 'canceled':
            return '#F44336';
        case 'completed':
            return '#1E3A8A';
        default:
            return '#B0B0B0';
    }
}