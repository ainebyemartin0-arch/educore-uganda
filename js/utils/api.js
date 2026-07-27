/* ============================================================
   EDU-CORE UGANDA — API UTILITY
   Fetch wrapper with JWT auth, offline queue, retry logic
   ============================================================ */

const API = (() => {
  // Configuration
  const BASE_URL = window.EDUCORE_CONFIG?.API_URL || '/api/v1';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  
  // Offline queue (stored in IndexedDB or memory)
  let offlineQueue = [];
  
  /**
   * Get stored auth token
   */
  function getToken() {
    try {
      const session = JSON.parse(localStorage.getItem('educore_session') || '{}');
      return session.accessToken || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Get current tenant (school) ID
   */
  function getTenantId() {
    return localStorage.getItem('educore_tenant_id') || null;
  }
  
  /**
   * Build request headers
   */
  function buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': getTenantId(),
      ...customHeaders
    };
    
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
  
  /**
   * Handle response
   */
  async function handleResponse(response) {
    if (response.status === 401) {
      // Token expired - trigger re-login
      window.dispatchEvent(new CustomEvent('educore:auth-expired'));
      throw new Error('Session expired. Please login again.');
    }
    
    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }
  
  /**
   * Core request function
   */
  async function request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers: customHeaders = {},
      retries = MAX_RETRIES,
      timeout = 30000,
      isOfflineQueued = false
    } = options;
    
    // Check online status
    if (!navigator.onLine && method !== 'GET') {
      if (isOfflineQueued) {
        // Queue write operations for later sync
        offlineQueue.push({ endpoint, options });
        window.dispatchEvent(new CustomEvent('educore:offline-queued', { 
          detail: { endpoint, method } 
        }));
        return { queued: true, message: 'Operation saved offline. Will sync when connected.' };
      }
      throw new Error('You are offline. Please connect to the internet.');
    }
    
    const url = `${BASE_URL}${endpoint}`;
    const fetchOptions = {
      method,
      headers: buildHeaders(customHeaders),
      signal: AbortSignal.timeout(timeout)
    };
    
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        return await handleResponse(response);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        if (attempt < retries && error.name !== 'TypeError') {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)));
          continue;
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Convenience methods
   */
  return {
    get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
    
    /**
     * Get offline queue status
     */
    getOfflineQueue: () => [...offlineQueue],
    
    /**
     * Process offline queue when back online
     */
    async processOfflineQueue() {
      const queue = [...offlineQueue];
      offlineQueue = [];
      
      for (const item of queue) {
        try {
          await request(item.endpoint, { ...item.options, isOfflineQueued: false });
        } catch (error) {
          // Re-queue failed items
          offlineQueue.push(item);
          console.warn('Failed to sync item:', item.endpoint, error);
        }
      }
      
      window.dispatchEvent(new CustomEvent('educore:sync-complete', {
        detail: { remaining: offlineQueue.length }
      }));
    },
    
    /**
     * Check connectivity
     */
    isOnline: () => navigator.onLine
  };
})();

// Export for module use
window.API = API;
