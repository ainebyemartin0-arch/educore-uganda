/* ============================================================
   EDU-CORE UGANDA — SUPER ADMIN DASHBOARD LOGIC
   Platform overview, stats, activity
   ============================================================ */

const SuperAdminDashboard = (() => {
  
  /**
   * Initialize dashboard
   */
  function init() {
    // Protect page
    if (!Permissions.protectPage()) return;
    
    // Check role
    if (Session.getRole() !== 'super_admin') {
      window.location.href = Permissions.getDashboardUrl();
      return;
    }
    
    // Load data
    loadStats();
    loadOnboardingQueue();
    loadActivityLog();
    generateMapDots();
    
    // Bind events
    document.getElementById('refreshBtn').addEventListener('click', () => {
      loadStats();
      loadOnboardingQueue();
      loadActivityLog();
      Notifications.info('Dashboard refreshed');
    });
    
    document.getElementById('onboardSchoolBtn').addEventListener('click', () => {
      window.location.href = 'onboarding.html';
    });
    
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      Session.logout('../../pages/login.html');
    });
    
    // Mobile menu toggle
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
  
  /**
   * Load and display stats
   */
  async function loadStats() {
    // Show shimmer while loading
    ['totalSchools', 'totalLearners', 'pendingOnboarding', 'systemUptime'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '...';
    });
    
    try {
      const stats = await API.get('/super-admin/stats/');
      updateStatDisplay(stats);
    } catch (error) {
      // Use demo data when API unavailable
      updateStatDisplay({
        total_schools: 48,
        total_learners: 12470,
        pending_onboarding: 3,
        system_uptime: '99.8%',
        school_trend: '+12 this month',
        learner_trend: '+1,240 this term'
      });
    }
  }
  
  /**
   * Update stat display
   */
  function updateStatDisplay(stats) {
    document.getElementById('totalSchools').textContent = stats.total_schools?.toLocaleString() || '--';
    document.getElementById('totalLearners').textContent = stats.total_learners?.toLocaleString() || '--';
    document.getElementById('pendingOnboarding').textContent = stats.pending_onboarding || '0';
    document.getElementById('systemUptime').textContent = stats.system_uptime || '99.9%';
    document.getElementById('schoolTrend').textContent = stats.school_trend || '--';
    document.getElementById('learnerTrend').textContent = stats.learner_trend || '--';
  }
  
  /**
   * Load onboarding queue
   */
  async function loadOnboardingQueue() {
    const container = document.getElementById('onboardingList');
    
    try {
      const queue = await API.get('/super-admin/onboarding-queue/');
      renderOnboardingQueue(queue, container);
    } catch (error) {
      // Demo data
      renderOnboardingQueue([
        { school_name: 'Kampala Secondary School', code: 'KLA-SS-042', requested_date: '2026-07-25', status: 'pending' },
        { school_name: 'Gulu Primary School', code: 'GLU-PS-018', requested_date: '2026-07-24', status: 'pending' },
        { school_name: 'Mbarara High School', code: 'MBR-HS-005', requested_date: '2026-07-23', status: 'pending' }
      ], container);
    }
  }
  
  /**
   * Render onboarding queue
   */
  function renderOnboardingQueue(queue, container) {
    if (!queue || queue.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:var(--space-3);">
          <p class="empty-state-description">No pending onboarding requests.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = queue.map(item => `
      <div class="onboarding-item">
        <div class="onboarding-info">
          <div class="school-avatar">${item.school_name.charAt(0)}</div>
          <div>
            <div style="font-weight:var(--font-weight-medium);font-size:var(--text-sm);">${item.school_name}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);font-family:var(--font-mono);">${item.code}</div>
          </div>
        </div>
        <div class="onboarding-meta">
          <span class="badge badge-warning">Pending</span>
          <div class="onboarding-date">${item.requested_date}</div>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Load activity log
   */
  async function loadActivityLog() {
    const container = document.getElementById('activityLog');
    
    try {
      const activities = await API.get('/super-admin/activity/');
      renderActivityLog(activities, container);
    } catch (error) {
      // Demo data
      renderActivityLog([
        { text: 'Kampala SS completed data sync', time: '2 minutes ago', type: 'sync' },
        { text: 'New school registered: Jinja Academy', time: '15 minutes ago', type: 'config' },
        { text: 'System backup completed', time: '1 hour ago', type: 'sync' },
        { text: 'Admin login from Entebbe PS', time: '2 hours ago', type: 'login' }
      ], container);
    }
  }
  
  /**
   * Render activity log
   */
  function renderActivityLog(activities, container) {
    if (!activities || activities.length === 0) {
      container.innerHTML = '<p style="font-size:var(--text-sm);color:var(--text-muted);padding:var(--space-2);">No recent activity.</p>';
      return;
    }
    
    container.innerHTML = activities.map(a => `
      <div class="activity-item">
        <div class="activity-dot ${a.type}"></div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Generate random map dots for visual effect
   */
  function generateMapDots() {
    const container = document.getElementById('mapDots');
    if (!container) return;
    
    let dots = '';
    for (let i = 0; i < 30; i++) {
      const top = Math.random() * 90;
      const left = Math.random() * 90;
      const delay = Math.random() * 2;
      dots += `<div class="map-dot" style="top:${top}%;left:${left}%;animation-delay:${delay}s;"></div>`;
    }
    container.innerHTML = dots;
  }
  
  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  return { init };
})();
