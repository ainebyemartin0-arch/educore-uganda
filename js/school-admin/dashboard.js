const SchoolDashboard = (() => {
  function init() {
    generateAttendanceCalendar();
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../../pages/login.html';
    });
    document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
  function generateAttendanceCalendar() {
    const container = document.getElementById('attendanceCalendar');
    if (!container) return;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = now.getDate();
    let html = '';
    for (let i = 1; i <= daysInMonth; i++) {
      let status = 'future';
      if (i < today) {
        const rand = Math.random();
        status = rand > 0.2 ? 'present' : rand > 0.1 ? 'late' : 'absent';
      } else if (i === today) {
        status = 'present';
      }
      html += `<div class="calendar-day ${status}" title="Day ${i}: ${status}">${i}</div>`;
    }
    container.innerHTML = html;
  }
  document.addEventListener('DOMContentLoaded', init);
  return { init };
})();
