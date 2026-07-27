/* ============================================================
   EDU-CORE UGANDA — PERMISSIONS & ACCESS CONTROL
   Role-based route protection
   ============================================================ */

const Permissions = (() => {
  
  // Role hierarchy and their allowed paths
  const ROLE_ROUTES = {
    super_admin: [
      '/pages/super-admin/',
      '/pages/login.html'
    ],
    school_admin: [
      '/pages/school-admin/',
      '/pages/login.html'
    ],
    teacher: [
      '/pages/teacher/',
      '/pages/login.html'
    ],
    district_official: [
      '/pages/district/',
      '/pages/login.html'
    ],
    ministry_official: [
      '/pages/ministry/',
      '/pages/login.html'
    ]
  };
  
  /**
   * Check if current user can access a path
   */
  function canAccess(path) {
    const role = Session.getRole();
    if (!role) return false;
    
    const allowedPaths = ROLE_ROUTES[role];
    if (!allowedPaths) return false;
    
    return allowedPaths.some(allowed => path.includes(allowed));
  }
  
  /**
   * Protect current page - redirect if unauthorized
   */
  function protectPage() {
    const currentPath = window.location.pathname;
    
    // Login page is always accessible
    if (currentPath.includes('/login.html')) return true;
    
    // Check authentication
    if (!Session.isValid()) {
      window.location.href = '/pages/login.html';
      return false;
    }
    
    // Check authorization
    if (!canAccess(currentPath)) {
      window.location.href = '/pages/unauthorized.html';
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if user has specific permission
   */
  function hasPermission(permission) {
    const user = Session.getUser();
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }
  
  /**
   * Check if user is admin (any level)
   */
  function isAdmin() {
    const role = Session.getRole();
    return ['super_admin', 'school_admin', 'district_official', 'ministry_official'].includes(role);
  }
  
  /**
   * Get dashboard URL for current user
   */
  function getDashboardUrl() {
    const role = Session.getRole();
    const dashboardMap = {
      super_admin: '/pages/super-admin/dashboard.html',
      school_admin: '/pages/school-admin/dashboard.html',
      teacher: '/pages/teacher/dashboard.html',
      district_official: '/pages/district/dashboard.html',
      ministry_official: '/pages/ministry/dashboard.html'
    };
    return dashboardMap[role] || '/pages/login.html';
  }
  
  return {
    canAccess,
    protectPage,
    hasPermission,
    isAdmin,
    getDashboardUrl,
    ROLES: ROLE_ROUTES
  };
})();

window.Permissions = Permissions;
