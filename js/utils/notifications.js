/* ============================================================
   EDU-CORE UGANDA — NOTIFICATION SYSTEM
   Toast messages with animations
   ============================================================ */

const Notifications = (() => {
  let container = null;
  
  /**
   * Create or get toast container
   */
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('role', 'status');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }
  
  /**
   * Generate toast ID
   */
  function generateId() {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Create and show a toast
   */
  function show(message, type = 'info', duration = 4000) {
    const container = getContainer();
    const id = generateId();
    
    // Toast HTML
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;
    toast.setAttribute('role', 'alert');
    
    // Icons (inline SVG)
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="toast-icon" style="color:var(--color-${type});flex-shrink:0;">
          ${icons[type] || icons.info}
        </span>
        <span style="flex:1;font-size:var(--text-sm);">${message}</span>
        <button onclick="this.closest('.toast').remove()" 
                style="color:var(--text-muted);flex-shrink:0;"
                aria-label="Dismiss notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.classList.add('removing');
          toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
              toast.remove();
            }
          });
        }
      }, duration);
    }
    
    return id;
  }
  
  return {
    success: (message, duration) => show(message, 'success', duration),
    error: (message, duration) => show(message, 'error', duration || 6000),
    warning: (message, duration) => show(message, 'warning', duration),
    info: (message, duration) => show(message, 'info', duration),
    
    /**
     * Dismiss a specific toast
     */
    dismiss: (id) => {
      const toast = document.getElementById(id);
      if (toast) {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove());
      }
    },
    
    /**
     * Clear all toasts
     */
    clear: () => {
      if (container) {
        container.innerHTML = '';
      }
    }
  };
})();

window.Notifications = Notifications;
