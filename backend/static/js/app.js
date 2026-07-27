/* ============================================================
   EDU-CORE UGANDA — APP INITIALIZATION
   Main entry point, routing, global event handling
   ============================================================ */

const EduCore = (() => {
  /**
   * Initialize the application
   */
  function init() {
    console.log('EduCore Uganda - Initializing...');
    
    // Initialize tenant context
    Tenant.init();
    
    // Register service worker for PWA
    registerServiceWorker();
    
    // Handle online/offline events
    setupConnectivityListeners();
    
    // Handle auth expiration
    window.addEventListener('educore:auth-expired', handleAuthExpired);
    
    // Handle offline queue
    window.addEventListener('educore:offline-queued', (e) => {
      Notifications.info('Saved offline. Will sync when connected.');
    });
    
    window.addEventListener('educore:sync-complete', (e) => {
      if (e.detail.remaining === 0) {
        Notifications.success('All data synced successfully.');
      } else {
        Notifications.warning(`${e.detail.remaining} items pending sync.`);
      }
    });
    
    console.log('EduCore Uganda - Initialized successfully');
  }
  
  /**
   * Register service worker
   */
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }
  
  /**
   * Setup connectivity listeners
   */
  function setupConnectivityListeners() {
    window.addEventListener('online', () => {
      Notifications.success('Back online! Syncing data...');
      API.processOfflineQueue();
    });
    
    window.addEventListener('offline', () => {
      Notifications.warning('You are offline. Changes will be saved locally.');
    });
  }
  
  /**
   * Handle expired authentication
   */
  function handleAuthExpired() {
    Notifications.error('Your session has expired. Please login again.');
    
    // Clear session
    localStorage.removeItem('educore_session');
    Tenant.clear();
    
    // Redirect to login after short delay
    setTimeout(() => {
      window.location.href = '/pages/login.html';
    }, 1500);
  }
  
  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    const session = JSON.parse(localStorage.getItem('educore_session') || '{}');
    return !!session.accessToken;
  }
  
  /**
   * Get current user
   */
  function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem('educore_session') || '{}');
    return session.user || null;
  }
  
  /**
   * Get user role
   */
  function getUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  return {
    init,
    isAuthenticated,
    getCurrentUser,
    getUserRole
  };
})();

window.EduCore = EduCore;
