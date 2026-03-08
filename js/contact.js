document.addEventListener('DOMContentLoaded', function() {
    // Handle both forms (homepage and contact page)
    const forms = document.querySelectorAll('#inquiryForm, #inquiryForm');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this);
        });
    });

    function handleFormSubmit(form) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');
        const formMessage = form.querySelector('.form-message') || document.getElementById('formMessage');
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        if (formMessage) formMessage.style.display = 'none';

        fetch('php/process-contact.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                if (formMessage) {
                    formMessage.textContent = data.message;
                    formMessage.className = 'form-message success';
                    formMessage.style.display = 'block';
                }
                form.reset();
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    if (formMessage) formMessage.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(data.message || 'Error submitting form');
            }
        })
        .catch(error => {
            if (formMessage) {
                formMessage.textContent = error.message || 'An error occurred. Please try again.';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
            }
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Inquiry';
        });
    }
});
