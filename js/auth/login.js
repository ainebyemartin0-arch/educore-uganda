/* ============================================================
   EDU-CORE UGANDA — LOGIN LOGIC
   Form handling, validation, JWT authentication
   ============================================================ */

const Login = (() => {
  
  // DOM Elements
  let form, schoolCodeInput, emailInput, passwordInput;
  let loginButton, errorContainer, errorMessage;
  let passwordToggle, eyeIcon;
  
  /**
   * Initialize login page
   */
  function init() {
    // Get DOM elements
    form = document.getElementById('loginForm');
    schoolCodeInput = document.getElementById('schoolCode');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginButton = document.getElementById('loginButton');
    errorContainer = document.getElementById('loginError');
    errorMessage = document.getElementById('loginErrorMessage');
    passwordToggle = document.getElementById('passwordToggle');
    eyeIcon = document.getElementById('eyeIcon');
    
    // Check if already logged in
    if (Session.isValid()) {
      redirectBasedOnRole();
      return;
    }
    
    // Pre-fill remembered school code
    const remembered = localStorage.getItem('educore_school_code');
    if (remembered) {
      schoolCodeInput.value = remembered;
    }
    
    // Bind events
    form.addEventListener('submit', handleSubmit);
    passwordToggle.addEventListener('click', togglePasswordVisibility);
    
    // Clear error on input
    [schoolCodeInput, emailInput, passwordInput].forEach(input => {
      input.addEventListener('input', clearError);
    });
  }
  
  /**
   * Toggle password visibility
   */
  function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Update eye icon
    if (isPassword) {
      eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }
  
  /**
   * Validate form
   */
  function validate() {
    const schoolCode = schoolCodeInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!schoolCode) {
      showError('Please enter your school code.');
      schoolCodeInput.focus();
      return false;
    }
    
    if (!email) {
      showError('Please enter your email or phone number.');
      emailInput.focus();
      return false;
    }
    
    if (!password) {
      showError('Please enter your password.');
      passwordInput.focus();
      return false;
    }
    
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      passwordInput.focus();
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle form submission
   */
  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validate
    if (!validate()) return;
    
    // Set loading state
    setLoading(true);
    clearError();
    
    const schoolCode = schoolCodeInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
      // Set tenant context
      Tenant.set(schoolCode);
      
      // Attempt login via API
      const response = await API.post('/auth/login/', {
        school_code: schoolCode,
        email: email,
        password: password
      });
      
      // Store session
      Session.create({
        accessToken: response.access,
        refreshToken: response.refresh,
        user: response.user,
        schoolCode: schoolCode,
        rememberMe: rememberMe
      });
      
      // Remember school code
      if (rememberMe) {
        localStorage.setItem('educore_school_code', schoolCode);
      }
      
      // Success notification
      Notifications.success('Login successful! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        redirectBasedOnRole(response.user.role);
      }, 500);
      
    } catch (error) {
      // Handle errors
      setLoading(false);
      
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        showError('Invalid credentials. Please check your school code, email, and password.');
      } else if (error.message.includes('offline')) {
        showError('You are offline. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        showError('Connection timed out. Please try again.');
      } else {
        showError(error.message || 'Login failed. Please try again.');
      }
    }
  }
  
  /**
   * Set loading state
   */
  function setLoading(isLoading) {
    if (isLoading) {
      loginButton.classList.add('loading');
      loginButton.textContent = 'Signing in...';
      loginButton.disabled = true;
    } else {
      loginButton.classList.remove('loading');
      loginButton.textContent = 'Sign In';
      loginButton.disabled = false;
    }
  }
  
  /**
   * Show error message
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.add('visible');
    // Re-trigger shake animation
    errorContainer.classList.remove('shake');
    void errorContainer.offsetWidth;
    errorContainer.classList.add('shake');
  }
  
  /**
   * Clear error message
   */
  function clearError() {
    errorContainer.classList.remove('visible');
  }
  
  /**
   * Redirect based on user role
   */
  function redirectBasedOnRole(role) {
    const routes = {
      'super_admin': '../pages/super-admin/dashboard.html',
      'school_admin': '../pages/school-admin/dashboard.html',
      'teacher': '../pages/teacher/dashboard.html',
      'district_official': '../pages/district/dashboard.html',
      'ministry_official': '../pages/ministry/dashboard.html'
    };
    
    const path = routes[role] || '../pages/school-admin/dashboard.html';
    window.location.href = path;
  }
  
  /**
   * Handle forgot password
   */
  document.addEventListener('DOMContentLoaded', () => {
    const forgotLink = document.getElementById('forgotPassword');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        Notifications.info('Please contact your school administrator to reset your password.');
      });
    }
  });
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  return { init };
})();

window.Login = Login;
