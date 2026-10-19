// Global Application State & Utility Functions
window.AppState = {
  activeProfile: null,
  readiness: null,
  review: null,
  isMsotAdmin: false,
  allProfiles: [],
  interviewSession: null,
  interviewTimerInterval: null,
  interviewSecondsRemaining: 900
};

// API Fetch Helper
async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${url}]:`, err);
    showToast(err.message, 'error');
    throw err;
  }
}

// Notification Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}" style="color: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// Global Privacy & Consent Modal
function openPrivacyModal() {
  const p = window.AppState.activeProfile;
  const display = document.getElementById('privacyRawJsonDisplay');
  if (display && p) {
    display.textContent = JSON.stringify(p, null, 2);
  }
  openModal('privacyModal');
}

function exportProfileJson() {
  const p = window.AppState.activeProfile;
  if (!p) return;
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(p.name || 'student').replace(/\s+/g, '_')}_placement_profile.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Profile data exported successfully.');
}

async function deleteCurrentProfilePermanently() {
  const p = window.AppState.activeProfile;
  if (!p) return;
  if (!confirm(`Are you sure you want to permanently purge all data for ${p.name}? This cannot be undone.`)) {
    return;
  }
  try {
    await apiRequest(`/api/profile/${p.id}`, { method: 'DELETE' });
    showToast(`Profile data for ${p.name} permanently deleted.`);
    closeModal('privacyModal');
    // Refresh profiles list
    await loadInitialProfiles();
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
window.AppState.currentUser = null;
window.AppState.randomEntries = [];

async function checkAuthStatus() {
  try {
    const res = await apiRequest('/api/auth/me');
    if (res.loggedIn && res.user) {
      window.AppState.currentUser = res.user;
      updateTopbarUserUI(res.user);
      if (res.user.role === 'staff') {
        window.AppState.isMsotAdmin = true;
      }
    } else {
      updateTopbarUserUI(null);
    }
  } catch (e) {
    console.warn('Auth check notice:', e.message);
  }
}

function updateTopbarUserUI(user) {
  const loginBtn = document.getElementById('navLoginBtn');
  const registerBtn = document.getElementById('navRegisterBtn');
  const userBtn = document.getElementById('topbarUserBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');
  const avatar = document.getElementById('topbarUserAvatar');
  const name = document.getElementById('topbarUserName');
  const roleTag = document.getElementById('topbarUserRoleTag');

  const singleAvatar = document.getElementById('singleUserAvatar');
  const singleName = document.getElementById('singleUserName');
  const singleRole = document.getElementById('singleUserRole');

  // When logged out:
  if (!user) {
    if (loginBtn) loginBtn.style.display = 'none'; // User request: remove sign in/login option from navbar too
    if (registerBtn) registerBtn.style.display = 'inline-flex';
    if (userBtn) userBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    // Reflect currently active candidate profile or guest in single-user capsule
    const active = window.AppState.activeProfile;
    if (active) {
      const initials = active.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      if (singleAvatar) singleAvatar.textContent = initials;
      if (singleName) singleName.textContent = active.name;
      if (singleRole) singleRole.textContent = active.targetRole || active.degree || 'Candidate';
    } else {
      if (singleAvatar) singleAvatar.textContent = 'G';
      if (singleName) singleName.textContent = 'Guest Session';
      if (singleRole) singleRole.textContent = 'Click to Sign In';
    }
    return;
  }

  // When logged in:
  // User request: lessen login feature if already logged in and replace by sign out
  if (loginBtn) loginBtn.style.display = 'none';
  if (registerBtn) registerBtn.style.display = 'none';
  if (userBtn) userBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (avatar) avatar.textContent = initials;
  if (name) name.textContent = user.name;
  if (roleTag) {
    roleTag.textContent = (user.role || 'student').toUpperCase();
    roleTag.className = user.role === 'staff' ? 'tape-tag hot' : 'tape-tag verified';
  }

  if (singleAvatar) singleAvatar.textContent = initials;
  if (singleName) singleName.textContent = user.name;
  if (singleRole) singleRole.textContent = user.department || (user.role === 'staff' ? 'Placement Cell' : (window.AppState.activeProfile?.targetRole || 'Candidate'));
}

async function logoutUser() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    window.AppState.currentUser = null;
    window.AppState.isMsotAdmin = false;
    updateTopbarUserUI(null);
    showToast('Signed out of placement session.');
  } catch (err) {
    console.error('Logout error:', err);
    window.AppState.currentUser = null;
    window.AppState.isMsotAdmin = false;
    updateTopbarUserUI(null);
  }
}

function openAuthModal(tab = 'signIn') {
  loadDemoUsersList();
  if (tab === 'account') {
    tab = window.AppState.currentUser ? 'demo' : 'signIn';
  }
  switchAuthTab(tab);
  openModal('authModal');
}

function switchAuthTab(tab) {
  const tabs = ['signIn', 'register', 'demo'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const pane = document.getElementById(`authPane${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
  });
}

function onRegisterRoleChange(role) {
  const stuFields = document.getElementById('regStudentFields');
  const staffFields = document.getElementById('regStaffFields');
  if (stuFields) stuFields.style.display = role === 'student' ? 'block' : 'none';
  if (staffFields) staffFields.style.display = role === 'staff' ? 'block' : 'none';
}

async function handleUserLogin(event) {
  if (event && event.preventDefault) event.preventDefault();
  const email = document.getElementById('loginEmail')?.value?.trim();
  const password = document.getElementById('loginPassword')?.value?.trim();

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      window.AppState.currentUser = res.user;
      updateTopbarUserUI(res.user);
      closeModal('authModal');
      showToast(`Welcome back, ${res.user.name}!`);

      if (res.user.role === 'staff') {
        switchWorkspaceMode('staff');
      } else {
        switchWorkspaceMode('student');
        if (res.profile) {
          window.AppState.activeProfile = res.profile;
          onSwitchProfile(res.profile.id);
        }
      }
    }
  } catch (err) {
    // Error toasted
  }
}

async function handleUserRegister(event) {
  if (event && event.preventDefault) event.preventDefault();
  const name = document.getElementById('regName')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const password = document.getElementById('regPassword')?.value?.trim();
  const role = document.getElementById('regRole')?.value || 'student';
  const targetRole = document.getElementById('regTargetRole')?.value?.trim();
  const degree = document.getElementById('regDegree')?.value?.trim();
  const college = document.getElementById('regCollege')?.value?.trim();
  const department = document.getElementById('regDepartment')?.value?.trim();

  try {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        targetRole: role === 'staff' ? department : targetRole,
        degree,
        college
      })
    });

    if (res.success) {
      window.AppState.currentUser = res.user;
      updateTopbarUserUI(res.user);
      closeModal('authModal');
      showToast(`Account created successfully! Welcome, ${res.user.name}.`);

      // Refresh list of profiles
      await loadInitialProfiles();

      if (role === 'staff') {
        switchWorkspaceMode('staff');
      } else {
        switchWorkspaceMode('student');
        if (res.profile) {
          onSwitchProfile(res.profile.id);
        }
      }
    }
  } catch (err) {
    // Error toasted
  }
}

async function loadDemoUsersList() {
  const container = document.getElementById('demoUsersListContainer');
  if (!container) return;

  try {
    const res = await apiRequest('/api/auth/demo-users');
    const users = res.users || [];
    container.innerHTML = users.map(u => `
      <div class="demo-user-card" onclick="quickLoginWith('${u.email}', '${u.password}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="demo-user-name">${u.name}</div>
          <span class="tape-tag ${u.role === 'staff' ? 'blue' : 'verified'}" style="font-size: 8.5px; padding: 1px 5px;">
            ${(u.role || 'student').toUpperCase()}
          </span>
        </div>
        <div class="demo-user-role">${u.department || (u.role === 'staff' ? 'Placement Cell' : 'B.Tech Candidate')}</div>
        <div style="font-size: 10.5px; color: var(--cyan-light); margin-top: 4px;">
          <i class="fa-solid fa-key" style="font-size: 9px;"></i> Click to Sign In
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

async function quickLoginWith(email, password) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  switchAuthTab('signIn');
  handleUserLogin(new Event('submit'));
}

// -------------------------------------------------------------
// RANDOM MOCK DATA VIEWER (READ-ONLY ENTRIES)
// -------------------------------------------------------------
async function openRandomDataModal() {
  openModal('randomDataModal');
  await loadRandomMockEntries();
}

async function loadRandomMockEntries() {
  const container = document.getElementById('randomDataGridContainer');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--cyan-light);"><i class="fa-solid fa-spinner fa-spin"></i> Fetching random data entries...</div>';

  try {
    const res = await apiRequest('/api/data/random-entries');
    window.AppState.randomEntries = res.entries || [];
    renderRandomDataCards(window.AppState.randomEntries);
    const countAll = document.getElementById('countRndAll');
    if (countAll) countAll.textContent = window.AppState.randomEntries.length;
  } catch (e) {
    container.innerHTML = '<div style="color: var(--danger); text-align: center;">Failed to load random mock data.</div>';
  }
}

async function generateFreshRandomEntries() {
  try {
    showToast('Generating 12 fresh randomized candidates and campus opportunities...');
    const res = await apiRequest('/api/data/random-seed', { method: 'POST' });
    window.AppState.randomEntries = res.entries || [];
    renderRandomDataCards(window.AppState.randomEntries);
    const countAll = document.getElementById('countRndAll');
    if (countAll) countAll.textContent = window.AppState.randomEntries.length;
    showToast(`Generated ${res.count} fresh random entries!`);
  } catch (e) {
    console.error(e);
  }
}

function renderRandomDataCards(entries) {
  const container = document.getElementById('randomDataGridContainer');
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted);">No random mock data entries found. Click "Generate New Random Batch" above.</div>';
    return;
  }

  container.innerHTML = entries.map(item => `
    <div class="random-entry-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="random-badge">RANDOM ENTRY • READ ONLY</span>
        <span style="font-size: 11px; color: var(--text-muted);">${item.generatedAt || 'Just now'}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
        <div class="user-auth-avatar" style="width: 32px; height: 32px; font-size: 12px;">
          ${item.candidateName.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div style="font-weight: 800; font-size: 13.5px; color: #fff;">${item.candidateName}</div>
          <div style="font-size: 11px; color: var(--cyan-light);">${item.targetRole}</div>
        </div>
      </div>

      <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin-top: 2px;">
        <div>${item.degree} • GPA: <strong>${item.cgpa}</strong></div>
        <div style="color: var(--text-muted);">${item.college}</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: rgba(0,0,0,0.3); border-radius: 6px; margin: 4px 0;">
        <span style="font-size: 11px; color: var(--text-secondary);">Placement Score:</span>
        <span style="font-weight: 800; font-size: 13px; color: ${item.readinessScore >= 80 ? 'var(--cyan-light)' : '#f59e0b'};">
          ${item.readinessScore} / 100
        </span>
      </div>

      <div style="font-size: 11.5px; color: #cbd5e1;">
        <span style="color: var(--text-muted);">Drive Match:</span> <strong>${item.matchedJob}</strong>
      </div>
      <div style="font-size: 11px; color: var(--success); font-weight: 700;">
        Stipend: ${item.stipend}
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
        ${(item.skills || []).map(s => `<span class="job-skill-pill" style="font-size: 9.5px; padding: 2px 7px;">${s}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function filterRandomData(status) {
  const buttons = ['All', 'Tier1', 'Comp'];
  buttons.forEach(b => {
    const el = document.getElementById(`btnFilterRnd${b}`);
    if (el) el.classList.remove('active');
  });

  if (status === 'all') {
    document.getElementById('btnFilterRndAll')?.classList.add('active');
    renderRandomDataCards(window.AppState.randomEntries);
  } else if (status === 'Tier-1 Ready') {
    document.getElementById('btnFilterRndTier1')?.classList.add('active');
    renderRandomDataCards(window.AppState.randomEntries.filter(e => e.status === 'Tier-1 Ready'));
  } else if (status === 'Competitive') {
    document.getElementById('btnFilterRndComp')?.classList.add('active');
    renderRandomDataCards(window.AppState.randomEntries.filter(e => e.status === 'Competitive'));
  }
}

function copyRandomDataJson() {
  const json = JSON.stringify(window.AppState.randomEntries, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showToast('Copied Random Mock Data JSON to clipboard!');
  }).catch(() => {
    showToast('Failed to copy JSON', 'error');
  });
}
