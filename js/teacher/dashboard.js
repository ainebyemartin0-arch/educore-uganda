const TeacherDashboard = (() => {
  let isCheckedIn = false;
  function init() {
    updateGreeting();
    checkExistingCheckin();
    document.getElementById('checkinBtn').addEventListener('click', handleCheckin);
    updateSyncStatus();
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
  }
  function handleCheckin() {
    const btn = document.getElementById('checkinBtn');
    const timeDisplay = document.getElementById('checkinTime');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (!isCheckedIn) {
      isCheckedIn = true;
      btn.classList.add('checked-in');
      btn.querySelector('span').textContent = 'Checked In';
      timeDisplay.textContent = 'Checked in at ' + timeStr;
      localStorage.setItem('teacher_checkin_today', JSON.stringify({ time: now.toISOString(), date: now.toDateString() }));
    } else {
      isCheckedIn = false;
      btn.classList.remove('checked-in');
      btn.querySelector('span').textContent = 'Check In';
      timeDisplay.textContent = 'Checked out at ' + timeStr;
    }
  }
  function checkExistingCheckin() {
    const stored = localStorage.getItem('teacher_checkin_today');
    if (!stored) return;
    const data = JSON.parse(stored);
    if (data.date === new Date().toDateString()) {
      isCheckedIn = true;
      const btn = document.getElementById('checkinBtn');
      btn.classList.add('checked-in');
      btn.querySelector('span').textContent = 'Checked In';
      document.getElementById('checkinTime').textContent = 'Checked in at ' + new Date(data.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  }
  function updateGreeting() {
    const hour = new Date().getHours();
    let g = 'Good morning';
    if (hour >= 12 && hour < 17) g = 'Good afternoon';
    if (hour >= 17) g = 'Good evening';
    const el = document.querySelector('.teacher-greeting');
    if (el) el.textContent = g + ',';
  }
  function updateSyncStatus() {
    const bar = document.getElementById('syncBar');
    const text = document.getElementById('syncText');
    if (!bar) return;
    bar.className = 'sync-bar ' + (navigator.onLine ? 'synced' : 'offline');
    if (text) text.textContent = navigator.onLine ? 'All changes synced' : 'Offline - saved locally';
  }
  document.addEventListener('DOMContentLoaded', init);
  return { init };
})();
