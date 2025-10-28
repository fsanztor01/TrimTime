export function initializeRating(appointment) {
    const barberStars = document.querySelectorAll('#barberStars .star');
    const appStars = document.querySelectorAll('#appStars .star');
    const commentInput = document.getElementById('ratingComment');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitRatingBtn');
    let barberRating = 0;
    let appRating = 0;

    // Resetear estrellas al abrir el modal
    barberStars.forEach(star => star.classList.remove('active'));
    appStars.forEach(star => star.classList.remove('active'));
    if (commentInput) commentInput.value = '';
    if (charCount) charCount.textContent = '0/100';
    if (submitBtn) submitBtn.disabled = true;

    // Star rating handlers - BARBERO
    barberStars.forEach(star => {
        star.onclick = () => {
            barberRating = parseInt(star.dataset.value);
            updateStars('#barberStars', barberRating);
            checkEnableSubmit();
        };
    });

    // Star rating handlers - APP
    appStars.forEach(star => {
        star.onclick = () => {
            appRating = parseInt(star.dataset.value);
            updateStars('#appStars', appRating);
            checkEnableSubmit();
        };
    });

    // Character count
    if (commentInput) {
        commentInput.addEventListener('input', () => {
            const count = commentInput.value.length;
            if (charCount) charCount.textContent = `${count}/100`;
        });
    }

    function updateStars(containerId, rating) {
        document.querySelectorAll(`${containerId} .star`).forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    function checkEnableSubmit() {
        if (submitBtn) {
            submitBtn.disabled = !(barberRating > 0 && appRating > 0);
        }
    }

    if (submitBtn) {
        submitBtn.onclick = async () => {
            try {
                const result = await DatabaseService.submitRating({
                    appointmentId: appointment.id,
                    barberRating,
                    appRating,
                    comment: commentInput ? commentInput.value.trim() : '',
                    barberId: appointment.employee_id,
                    userId: state.currentUser.id
                });

                if (result.success) {
                    showToast(translations[state.currentLanguage]['rating.success'], 'success');
                    closeModal('ratingModal');
                    renderAppointments(); // Refresh appointments list
                }
            } catch (error) {
                console.error('Error submitting rating:', error);
                showToast('Error submitting rating', 'error');
            }
        };
    }
}