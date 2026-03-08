document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  
  errorMessage.textContent = '';
  
  fetch('php/login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = 'admin-dashboard.html';
    } else {
      errorMessage.textContent = data.message || 'Invalid username or password';
    }
  })
  .catch(error => {
    errorMessage.textContent = 'An error occurred. Please try again.';
    console.error('Error:', error);
  });
});
