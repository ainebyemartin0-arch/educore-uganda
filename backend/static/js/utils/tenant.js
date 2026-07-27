/* ============================================================
   EDU-CORE UGANDA — TENANT CONTEXT
   School isolation context management
   ============================================================ */

const Tenant = (() => {
  let currentTenant = null;
  
  /**
   * Initialize tenant context
   * Detects from: URL subdomain, path param, localStorage
   */
  function init() {
    // Try URL path: /school/{schoolCode}
    const pathMatch = window.location.pathname.match(/^\/school\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      setTenant(pathMatch[1]);
      return currentTenant;
    }
    
    // Try subdomain: schoolcode.educore.ug
    const hostname = window.location.hostname;
    const subdomainMatch = hostname.match(/^([a-zA-Z0-9_-]+)\.educore\.ug/);
    if (subdomainMatch && subdomainMatch[1] !== 'www') {
      setTenant(subdomainMatch[1]);
      return currentTenant;
    }
    
    // Try localStorage (from previous session)
    const stored = localStorage.getItem('educore_tenant_id');
    if (stored) {
      currentTenant = JSON.parse(stored);
      return currentTenant;
    }
    
    return null;
  }
  
  /**
   * Set tenant context
   */
  function setTenant(schoolCode) {
    currentTenant = {
      code: schoolCode,
      id: null, // Will be populated after API call
      name: null
    };
    
    localStorage.setItem('educore_tenant_id', JSON.stringify(currentTenant));
  }
  
  /**
   * Get current tenant
   */
  function get() {
    if (!currentTenant) {
      return init();
    }
    return currentTenant;
  }
  
  /**
   * Get tenant ID for API calls
   */
  function getId() {
    const tenant = get();
    return tenant ? tenant.id : null;
  }
  
  /**
   * Get tenant code
   */
  function getCode() {
    const tenant = get();
    return tenant ? tenant.code : null;
  }
  
  /**
   * Clear tenant context
   */
  function clear() {
    currentTenant = null;
    localStorage.removeItem('educore_tenant_id');
  }
  
  /**
   * Check if tenant is set
   */
  function isSet() {
    return !!get();
  }
  
  // Auto-initialize
  init();
  
  return { init, get, getId, getCode, set: setTenant, clear, isSet };
})();

window.Tenant = Tenant;
