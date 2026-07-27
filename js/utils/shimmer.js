/* ============================================================
   EDU-CORE UGANDA — SHIMMER SKELETON LOADER
   Dynamic skeleton generation
   ============================================================ */

const Shimmer = (() => {
  /**
   * Create shimmer placeholder for a container
   */
  function create(container, options = {}) {
    const {
      type = 'card',      // card, table, text, stat
      count = 1,
      className = ''
    } = options;
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < count; i++) {
      const element = document.createElement('div');
      
      switch (type) {
        case 'card':
          element.className = 'shimmer shimmer-card';
          element.style.minHeight = '120px';
          break;
          
        case 'table-row':
          element.className = 'shimmer';
          element.style.cssText = 'height:48px;margin-bottom:4px;border-radius:var(--radius-sm);';
          break;
          
        case 'text':
          element.className = 'shimmer shimmer-text';
          break;
          
        case 'stat':
          element.innerHTML = `
            <div class="shimmer shimmer-text" style="width:60%;height:12px;margin-bottom:8px;"></div>
            <div class="shimmer shimmer-text" style="width:80%;height:32px;margin-bottom:4px;"></div>
            <div class="shimmer shimmer-text" style="width:40%;height:12px;"></div>
          `;
          element.style.cssText = 'padding:var(--space-3);';
          break;
          
        case 'avatar-text':
          element.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="shimmer shimmer-avatar"></div>
              <div style="flex:1;">
                <div class="shimmer shimmer-text" style="width:70%;"></div>
                <div class="shimmer shimmer-text" style="width:40%;"></div>
              </div>
            </div>
          `;
          element.style.cssText = 'padding:12px;';
          break;
          
        default:
          element.className = 'shimmer';
      }
      
      if (className) {
        element.classList.add(className);
      }
      
      fragment.appendChild(element);
    }
    
    // Clear container and add shimmer
    container.innerHTML = '';
    container.appendChild(fragment);
    
    return container;
  }
  
  /**
   * Remove shimmer and restore content
   */
  function remove(container) {
    container.querySelectorAll('.shimmer').forEach(el => el.remove());
  }
  
  /**
   * Show shimmer while loading
   */
  async function load(container, asyncFn, options = {}) {
    create(container, options);
    
    try {
      const result = await asyncFn();
      remove(container);
      return result;
    } catch (error) {
      remove(container);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <p class="empty-state-title">Failed to load data</p>
          <p class="empty-state-description">Please check your connection and try again.</p>
          <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
        </div>
      `;
      throw error;
    }
  }
  
  return { create, remove, load };
})();

window.Shimmer = Shimmer;
