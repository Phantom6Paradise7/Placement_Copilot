// Module 1: Profile Intake & Management
function populateIntakeForm(profile) {
  if (!profile) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('inputName', profile.name);
  setVal('inputCollege', profile.college);
  setVal('inputTargetRole', profile.targetRole);
  setVal('inputLocations', (profile.targetLocations || []).join(', '));
  setVal('inputGithub', profile.github?.profileUrl || (profile.github?.username ? `https://github.com/${profile.github.username}` : ''));
  setVal('inputLeetcode', profile.leetCode?.profileUrl || (profile.leetCode?.username ? `https://leetcode.com/${profile.leetCode.username}` : ''));
  setVal('inputLinkedIn', profile.linkedIn?.profileUrl || '');

  const consentBox = document.getElementById('consentCheckbox');
  if (consentBox) consentBox.checked = profile.consentGiven !== false;

  const statusText = document.getElementById('uploadStatusText');
  if (statusText && profile.resume) {
    statusText.innerHTML = `<i class="fa-solid fa-file-check"></i> Loaded resume: <strong>${profile.resume.fileName || 'Resume.pdf'}</strong> (${profile.resume.pageCount || 1} page)`;
  }
}

// Handle Conversational Chat Input
async function sendIntakeChatMessage() {
  const input = document.getElementById('intakeChatInput');
  const text = (input?.value || '').trim();
  if (!text) return;

  input.value = '';
  appendIntakeMessage('user', text);

  try {
    const activeId = window.AppState.activeProfile?.id;
    const res = await apiRequest('/api/profile/chat-intake', {
      method: 'POST',
      body: JSON.stringify({ message: text, profileId: activeId })
    });

    appendIntakeMessage('ai', res.reply || 'Profile updated successfully.');

    if (res.profile) {
      window.AppState.activeProfile = res.profile;
      populateIntakeForm(res.profile);
    }
    if (res.readiness) {
      window.AppState.readiness = res.readiness;
      renderReadinessScore(res.readiness);
    }
  } catch (err) {
    appendIntakeMessage('ai', 'Encountered an issue processing that detail. Please try again.');
  }
}

function handleIntakeInputKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendIntakeChatMessage();
  }
}

function appendIntakeMessage(sender, text) {
  const container = document.getElementById('intakeChatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;
  div.innerHTML = `
    <div class="chat-avatar ${sender}">
      <i class="fa-solid ${sender === 'ai' ? 'fa-sparkles' : 'fa-user'}"></i>
    </div>
    <div class="chat-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Handle Resume File Upload (PDF/DOCX)
async function handleResumeUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusText = document.getElementById('uploadStatusText');
  if (statusText) {
    statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Parsing resume structure & layout...`;
  }

  const formData = new FormData();
  formData.append('resume', file);
  formData.append('profileId', window.AppState.activeProfile?.id || '');

  try {
    const res = await fetch('/api/upload-resume', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    showToast(`Resume uploaded: ${data.message}`);
    if (statusText) {
      statusText.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${file.name} parsed (${data.resume?.pageCount} page)`;
    }

    if (data.readiness) {
      window.AppState.readiness = data.readiness;
      renderReadinessScore(data.readiness);
    }
    if (data.review) {
      window.AppState.review = data.review;
      renderReviewEngine(data.review);
    }
  } catch (err) {
    console.error('Resume upload failed:', err);
    showToast(err.message, 'error');
    if (statusText) {
      statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> Upload failed: ${err.message}`;
    }
  }
}

// Save Direct Form Changes
async function saveProfileChanges() {
  const p = window.AppState.activeProfile || {};
  const getVal = id => document.getElementById(id)?.value?.trim() || '';

  const updated = {
    ...p,
    name: getVal('inputName') || p.name,
    college: getVal('inputCollege') || p.college,
    targetRole: getVal('inputTargetRole') || p.targetRole,
    targetLocations: getVal('inputLocations').split(',').map(s => s.trim()).filter(Boolean),
    consentGiven: document.getElementById('consentCheckbox')?.checked !== false
  };

  const ghUrl = getVal('inputGithub');
  if (ghUrl) {
    const ghUser = ghUrl.replace(/https?:\/\/github\.com\//i, '').replace(/\/$/, '');
    updated.github = { ...(updated.github || {}), username: ghUser, profileUrl: ghUrl };
  }

  const lcUrl = getVal('inputLeetcode');
  if (lcUrl) {
    const lcUser = lcUrl.replace(/https?:\/\/leetcode\.com\//i, '').replace(/\/$/, '');
    updated.leetCode = { ...(updated.leetCode || {}), username: lcUser, profileUrl: lcUrl };
  }

  const liUrl = getVal('inputLinkedIn');
  if (liUrl) {
    updated.linkedIn = { ...(updated.linkedIn || {}), profileUrl: liUrl };
  }

  try {
    const res = await apiRequest('/api/profile', {
      method: 'POST',
      body: JSON.stringify(updated)
    });

    window.AppState.activeProfile = res.profile;
    window.AppState.readiness = res.readiness;
    renderReadinessScore(res.readiness);
    showToast('Profile and readiness score updated!');
    updateSidebarGlance(res.profile, res.readiness);
  } catch (err) {
    console.error(err);
  }
}
