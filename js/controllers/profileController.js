// js/controllers/profileController.js
import { DatabaseService } from '../services/databaseService.js';
import { translations } from '../services/translation.js';
import { showToast } from '../utils/uiUtils.js';
import { generateId } from '../utils/constants.js';

export class ProfileController {
    static setupEventListeners(state, elements) {
        console.log('Setting up profile controller event listeners...');

        // Profile
        if (elements.profileForm) {
            elements.profileForm.addEventListener('submit', (e) => ProfileController.updateProfile(e, state));
        }

        if (elements.changePhotoBtn) {
            elements.changePhotoBtn.addEventListener('click', () => {
                elements.photoInput.click();
            });
        }

        if (elements.photoInput) {
            elements.photoInput.addEventListener('change', (e) => ProfileController.handlePhotoUpload(e, state));
        }

        if (elements.contactForm) {
            elements.contactForm.addEventListener('submit', (e) => ProfileController.submitContactForm(e, state));
        }

        // Rating
        elements.ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                ProfileController.setRating(rating);
            });
        });

        if (elements.submitRating) {
            elements.submitRating.addEventListener('click', ProfileController.submitRating);
        }

    }

    static async updateProfile(e, state) {
        e.preventDefault();

        try {
            const result = await DatabaseService.updateUser(state.currentUser.id, {
                name: document.getElementById('profileName').value,
                email: document.getElementById('profileEmail').value,
                phone: document.getElementById('profilePhone').value,
                prefBarber: document.getElementById('prefBarber').value,
                prefService: document.getElementById('prefService').value,
                push: document.getElementById('notifications').checked
            });

            if (result.success) {
                // Update local state
                state.currentUser = {
                    ...state.currentUser,
                    name: document.getElementById('profileName').value,
                    email: document.getElementById('profileEmail').value,
                    phone: document.getElementById('profilePhone').value,
                    prefBarber: document.getElementById('prefBarber').value,
                    prefService: document.getElementById('prefService').value,
                    push: document.getElementById('notifications').checked
                };

                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));

                showToast(translations[state.currentLanguage]['profileUpdated'] || 'Profile updated successfully', 'success');
            } else {
                showToast('Error updating profile', 'error');
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast('Error updating profile', 'error');
        }
    }

    static async handlePhotoUpload(e, state) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async function (event) {
                const photoData = event.target.result;

                try {
                    const result = await DatabaseService.updateUser(state.currentUser.id, { photo: photoData });

                    if (result.success) {
                        state.currentUser.photo = photoData;
                        sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));

                        const profilePhoto = document.getElementById('profilePhoto');
                        if (profilePhoto) {
                            profilePhoto.src = photoData;
                        }
                        showToast(translations[state.currentLanguage]['photoUpdated'] || 'Profile photo updated', 'success');
                    } else {
                        showToast('Error updating photo', 'error');
                    }
                } catch (error) {
                    console.error("Error updating photo:", error);
                    showToast('Error updating photo', 'error');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    static renderFAQ(state) {
        const faq = [
            {
                question: translations[state.currentLanguage]['faq.q1'] || 'How far in advance should I book?',
                answer: translations[state.currentLanguage]['faq.a1'] || 'We recommend booking at least 3-5 days in advance to ensure availability, especially for weekends.'
            },
            {
                question: translations[state.currentLanguage]['faq.q2'] || 'What is your cancellation policy?',
                answer: translations[state.currentLanguage]['faq.a2'] || 'We require at least 24 hours notice for cancellations. Late cancellations may be subject to a fee.'
            },
            {
                question: translations[state.currentLanguage]['faq.q3'] || 'Do you offer walk-in appointments?',
                answer: translations[state.currentLanguage]['faq.a3'] || 'We welcome walk-ins when available, but appointments are recommended to guarantee your spot.'
            },
            {
                question: translations[state.currentLanguage]['faq.q4'] || 'What payment methods do you accept?',
                answer: translations[state.currentLanguage]['faq.a4'] || 'We accept cash, credit cards, and mobile payment options.'
            }
        ];

        const container = document.getElementById('faqAccordion');
        if (container) {
            container.innerHTML = '';

            faq.forEach((item, index) => {
                const faqItem = document.createElement('div');
                faqItem.className = 'accordion-item';

                faqItem.innerHTML = `
                    <div class="accordion-header">
                        <h4>${item.question}</h4>
                        <span class="accordion-icon">▼</span>
                    </div>
                    <div class="accordion-content">
                        <div class="accordion-body">
                            <p>${item.answer}</p>
                        </div>
                    </div>
                `;

                const header = faqItem.querySelector('.accordion-header');
                header.addEventListener('click', () => {
                    faqItem.classList.toggle('active');
                });

                container.appendChild(faqItem);
            });
        }
    }

    static async submitContactForm(e) {
        e.preventDefault();

        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();

        // Validate form
        if (!subject || !message) {
            showToast(translations[state.currentLanguage]['contact.fillAllFields'] || 'Please fill in all fields', 'error');
            return;
        }

        try {
            // Save message to database
            const messageData = {
                id: Date.now().toString(),
                userId: state.currentUser.id,
                userName: state.currentUser.name,
                userEmail: state.currentUser.email,
                subject: subject,
                message: message,
                read: false,
                createdAt: new Date().toISOString()
            };

            const result = await DatabaseService.saveMessage(messageData);

            if (result.success) {
                // Show success notification with animation
                showToast(translations[state.currentLanguage]['messageSent'] || 'Message sent successfully! We\'ll get back to you soon.', 'success');

                // Reset form
                document.getElementById('contactSubject').value = '';
                document.getElementById('contactMessage').value = '';

                // Add visual feedback
                const contactForm = document.getElementById('contactForm');
                if (contactForm) {
                    contactForm.classList.add('form-success');
                    setTimeout(() => {
                        contactForm.classList.remove('form-success');
                    }, 2000);
                }
            } else {
                showToast(translations[state.currentLanguage]['contact.error'] || 'Error sending message. Please try again.', 'error');
            }
        } catch (error) {
            console.error("Error sending message:", error);
            showToast(translations[state.currentLanguage]['contact.error'] || 'Error sending message. Please try again.', 'error');
        }
    }

    static setRating(rating) {
        const ratingStars = document.querySelectorAll('.star');
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });

        // Store rating for submission
        state.currentRating = rating;
    }

    static submitRating() {
        if (!state.currentRating) {
            showToast('Please select a rating', 'error');
            return;
        }

        // In a real app, this would send the rating to a server
        // For this demo, we'll just show a success message
        showToast(`${translations[state.currentLanguage]['thankYouRating'] || 'Thank you for rating us'} ${state.currentRating} stars!`, 'success');

        // Reset rating
        state.currentRating = 0;
        const ratingStars = document.querySelectorAll('.star');
        ratingStars.forEach(star => {
            star.classList.remove('active');
        });
    }

}