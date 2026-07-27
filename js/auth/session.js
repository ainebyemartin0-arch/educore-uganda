/* ============================================================
   EDU-CORE UGANDA — SESSION MANAGEMENT
   JWT storage, refresh, expiry, logout
   ============================================================ */

const Session = (() => {
  
  const SESSION_KEY = 'educore_session';
  
  /**
   * Create new session
   */
  function create({ accessToken, refreshToken, user, schoolCode, rememberMe }) {
    const session = {
      accessToken,
      refreshToken,
      user,
      schoolCode,
      createdAt: Date.now(),
      rememberMe: rememberMe || false
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('educore:session-created', {
      detail: { user: user }
    }));
  }
  
  /**
   * Get current session
   */
  function get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  /**
   * Get access token
   */
  function getToken() {
    const session = get();
    return session ? session.accessToken : null;
  }
  
  /**
   * Get current user
   */
  function getUser() {
    const session = get();
    return session ? session.user : null;
  }
  
  /**
   * Get user role
   */
  function getRole() {
    const user = getUser();
    return user ? user.role : null;
  }
  
  /**
   * Check if session is valid (not expired)
   */
  function isValid() {
    const session = get();
    if (!session) return false;
    
    // Check token expiry via JWT decode
    try {
      const payload = decodeToken(session.accessToken);
      if (!payload || !payload.exp) return false;
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }
  
  /**
   * Decode JWT without verification (for expiry check only)
   */
  function decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
  
  /**
   * Refresh token
   */
  async function refresh() {
    const session = get();
    if (!session || !session.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await API.post('/auth/refresh/', {
        refresh: session.refreshToken
      });
      
      // Update session with new tokens
      create({
        accessToken: response.access,
        refreshToken: response.refresh || session.refreshToken,
        user: session.user,
        schoolCode: session.schoolCode,
        rememberMe: session.rememberMe
      });
      
      return response.access;
    } catch (error) {
      // Refresh failed - force logout
      destroy();
      throw error;
    }
  }
  
  /**
   * Destroy session (logout)
   */
  function destroy() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('educore_school_code');
    Tenant.clear();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('educore:session-destroyed'));
  }
  
  /**
   * Logout and redirect
   */
  function logout(redirectUrl) {
    // Try to call logout API (fire and forget)
    const token = getToken();
    if (token) {
      API.post('/auth/logout/', { refresh: get().refreshToken })
        .catch(() => {});
    }
    
    destroy();
    
    // Redirect
    window.location.href = redirectUrl || '../pages/login.html';
  }
  
  /**
   * Setup auto-refresh interval
   */
  function startAutoRefresh(intervalMinutes = 15) {
    // Clear existing interval
    stopAutoRefresh();
    
    // Set new interval
    const intervalId = setInterval(async () => {
      if (isValid()) {
        try {
          await refresh();
        } catch {
          // Session expired
          window.dispatchEvent(new CustomEvent('educore:auth-expired'));
        }
      }
    }, intervalMinutes * 60 * 1000);
    
    localStorage.setItem('educore_refresh_interval', intervalId);
  }
  
  /**
   * Stop auto-refresh
   */
  function stopAutoRefresh() {
    const intervalId = localStorage.getItem('educore_refresh_interval');
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem('educore_refresh_interval');
    }
  }
  
  // Start auto-refresh on valid session
  if (isValid()) {
    startAutoRefresh();
  }
  
  return {
    create,
    get,
    getToken,
    getUser,
    getRole,
    isValid,
    refresh,
    destroy,
    logout,
    startAutoRefresh,
    stopAutoRefresh
  };
})();

window.Session = Session;
