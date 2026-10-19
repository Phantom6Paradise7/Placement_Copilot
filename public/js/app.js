// Application Main Controller & Navigation Router

// View Switcher
function switchView(viewId) {
  // Update website nav links
  const siteLinks = document.querySelectorAll('.site-nav-link');
  siteLinks.forEach(link => {
    if (link.getAttribute('data-nav-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Sync SweetTape "ROLL IT!" puck rail
  const allRolls = document.querySelectorAll('.sweet-roll-puck');
  allRolls.forEach(r => {
    if (r.getAttribute('data-target-view') === viewId) {
      r.classList.add('active');
    } else {
      r.classList.remove('active');
    }
  });

  // Update legacy sidebar nav items if present
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible page view
  const views = document.querySelectorAll('.page-view');
  views.forEach(v => {
    v.classList.remove('active');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }

  // Update topbar heading
  const headings = {
    'personality-studio-view': 'Career Personality Studio & Engineering Archetype Profiler',
    'dashboard-view': 'Placement Readiness Dashboard & Cohort Metrics',
    'resume-builder-view': 'Student 1-Page ATS Resume Builder & Live Preview',
    'skills-lab-view': 'Areas of Interest & Custom Tech Skills Lab',
    'review-engine-view': 'Placement Benchmark Review Engine',
    'mock-interview-view': 'Claude 3.5 AI Technical & Behavioral Mock Interview',
    'job-discovery-view': 'Global LLM Boolean Job Discovery (Naukri-Style)',
    'applications-view': 'Placement Applications Pipeline Tracker',
    'staff-hub-view': 'MSOT Staff Placement Control Center & Broadcasts',
    'testing-report-view': 'Testing & Scalability Verification Report',
    'settings-view': 'AI Provider & Engine Settings'
  };
  const titleEl = document.getElementById('pageTitleHeading');
  if (titleEl && headings[viewId]) {
    titleEl.textContent = headings[viewId];
  }

  // View-specific trigger actions
  if (viewId === 'personality-studio-view') {
    if (window.PersonalityStudio) PersonalityStudio.init();
  } else if (viewId === 'dashboard-view' && window.AppState.readiness) {
    renderReadinessScore(window.AppState.readiness);
  } else if (viewId === 'resume-builder-view') {
    loadResumeBuilderData();
  } else if (viewId === 'skills-lab-view') {
    loadSkillsLab();
  } else if (viewId === 'review-engine-view') {
    if (!window.AppState.review) runComprehensiveReview();
  } else if (viewId === 'job-discovery-view') {
    loadJobDiscoveryData();
  } else if (viewId === 'applications-view') {
    loadApplications();
  } else if (viewId === 'staff-hub-view') {
    loadStaffBroadcasts();
  } else if (viewId === 'testing-report-view') {
    loadTestReportData();
  } else if (viewId === 'mock-interview-view') {
    if (!window.AppState.interviewSession) {
      startMockInterview();
    }
  }
}

// Workspace Mode Switcher (Student Workspace vs Staff Center)
function switchWorkspaceMode(mode) {
  const isStaff = mode === 'staff';
  window.AppState.isMsotAdmin = isStaff;

  const staffBtnText = document.getElementById('topbarStaffBtnText');
  if (staffBtnText) staffBtnText.textContent = isStaff ? 'Student Portal' : 'Staff Portal';

  if (isStaff) {
    showToast('Switched to MSOT Placement Staff Control Center.');
    switchView('staff-hub-view');
  } else {
    showToast('Switched to Student Personality & Career Hub.');
    switchView('personality-studio-view');
  }
}

// Switch Active Student Profile
async function onSwitchProfile(profileId) {
  try {
    const res = await apiRequest('/api/profile/switch', {
      method: 'POST',
      body: JSON.stringify({ profileId })
    });

    window.AppState.activeProfile = res.profile;
    window.AppState.readiness = res.readiness;
    window.AppState.review = null;
    window.AppState.interviewSession = null;

    updateSidebarGlance(res.profile, res.readiness);
    renderReadinessScore(res.readiness);

    if (window.PersonalityStudio) {
      PersonalityStudio.loadProfilePersonality();
    }

    showToast(`Switched active candidate to: ${res.profile.name}`);

    const activeView = document.querySelector('.page-view.active')?.id;
    if (activeView === 'personality-studio-view' && window.PersonalityStudio) PersonalityStudio.init();
    if (activeView === 'resume-builder-view') loadResumeBuilderData();
    if (activeView === 'skills-lab-view') loadSkillsLab();
    if (activeView === 'review-engine-view') runComprehensiveReview();
    if (activeView === 'job-discovery-view') loadJobDiscoveryData();
    if (activeView === 'applications-view') loadApplications();
    if (activeView === 'staff-hub-view') loadStaffBroadcasts();
  } catch (err) {
    console.error('Failed to switch profile:', err);
  }
}

function updateSidebarGlance(profile, readiness) {
  if (!profile) return;

  const initials = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatar = document.getElementById('sidebarAvatar');
  const name = document.getElementById('sidebarName');
  const role = document.getElementById('sidebarRole');

  if (avatar) avatar.textContent = initials || 'ST';
  if (name) name.textContent = profile.name;
  if (role) role.textContent = profile.targetRole || profile.degree;

  // Identity Passport in Personality Studio
  const passAvatar = document.getElementById('passportAvatar');
  const passName = document.getElementById('passportName');
  const passCollege = document.getElementById('passportCollege');
  const passTag = document.getElementById('passportArchetypeTag');
  const passAts = document.getElementById('passportAtsScore');
  const passTier = document.getElementById('passportTier');

  if (passAvatar) passAvatar.textContent = initials || 'ST';
  if (passName) passName.textContent = profile.name;
  if (passCollege) passCollege.textContent = `${profile.degree || 'B.Tech CSE'} • ${profile.college || 'RV College of Engineering'}`;
  if (passTag) passTag.textContent = profile.personality?.archetype || 'THE FULL-STACK ARCHITECT';
  if (passAts && readiness) passAts.textContent = `${readiness.totalScore}/100`;
  if (passTier && readiness) {
    passTier.textContent = readiness.totalScore >= 75 ? 'Tier-1 Ready' : (readiness.totalScore >= 50 ? 'Tier-2 Progress' : 'Foundation Level');
  }

  // Topbar user button
  const topAvatar = document.getElementById('topbarUserAvatar');
  const topName = document.getElementById('topbarUserName');
  if (topAvatar) topAvatar.textContent = initials || 'ST';
  if (topName) topName.textContent = profile.name;

  const scoreBadge = document.getElementById('sidebarScoreBadge');
  if (scoreBadge && readiness) {
    scoreBadge.textContent = `${readiness.totalScore}/100`;
    scoreBadge.style.color = readiness.totalScore >= 75 ? 'var(--cyan-light)' : (readiness.totalScore >= 50 ? '#f59e0b' : '#ef4444');
  }

  // Update status bar student name if present
  const statusStudent = document.getElementById('statusStudentName');
  if (statusStudent) statusStudent.textContent = profile.name;

  // Update top navigation single active user capsule
  const singleAvatar = document.getElementById('singleUserAvatar');
  const singleName = document.getElementById('singleUserName');
  const singleRole = document.getElementById('singleUserRole');
  if (singleAvatar) singleAvatar.textContent = initials || 'ST';
  if (singleName) singleName.textContent = profile.name;
  if (singleRole) singleRole.textContent = profile.targetRole || profile.degree || 'Candidate';
}

// Initial Data Loading
async function loadInitialProfiles() {
  try {
    const data = await apiRequest('/api/profiles');
    window.AppState.allProfiles = data.profiles || [];

    const activeData = await apiRequest('/api/profile/active');
    window.AppState.activeProfile = activeData.profile;
    window.AppState.readiness = activeData.readiness;

    updateSidebarGlance(activeData.profile, activeData.readiness);
    renderReadinessScore(activeData.readiness);

    loadSettings();
  } catch (err) {
    console.error('Initial load failed:', err);
  }
}

// Settings Handlers
// Settings Handlers
async function loadSettings() {
  try {
    const s = await apiRequest('/api/settings');
    const provSelect = document.getElementById('settingAiProvider');
    const geminiKeyInput = document.getElementById('settingGeminiApiKey');
    const geminiModelSelect = document.getElementById('settingGeminiModel');
    const claudeKeyInput = document.getElementById('settingClaudeApiKey');
    const claudeModelSelect = document.getElementById('settingClaudeModel');
    const urlInput = document.getElementById('settingOllamaUrl');
    const modelInput = document.getElementById('settingOllamaModel');
    const autoTtsBox = document.getElementById('settingAutoTts');

    // ElevenLabs Configuration
    const elevenKeyInput = document.getElementById('settingElevenLabsApiKey');
    const elevenVoiceSelect = document.getElementById('settingElevenLabsVoiceId');
    const elevenModelSelect = document.getElementById('settingElevenLabsModelId');
    const elevenCustomVoiceInput = document.getElementById('settingCustomVoiceId');

    const provider = s.aiProvider || 'gemini';
    if (provSelect) provSelect.value = provider;
    if (geminiKeyInput && s.geminiApiKey) geminiKeyInput.value = s.geminiApiKey;
    if (geminiModelSelect && s.geminiModel) geminiModelSelect.value = s.geminiModel;
    if (claudeKeyInput && s.claudeApiKey) claudeKeyInput.value = s.claudeApiKey;
    if (claudeModelSelect && s.claudeModel) claudeModelSelect.value = s.claudeModel;
    if (urlInput && s.ollamaEndpoint) urlInput.value = s.ollamaEndpoint;
    if (modelInput && s.ollamaModel) modelInput.value = s.ollamaModel;
    if (autoTtsBox && typeof s.autoSpeakTTS === 'boolean') autoTtsBox.checked = s.autoSpeakTTS;

    if (elevenKeyInput && s.elevenLabsApiKey) elevenKeyInput.value = s.elevenLabsApiKey;
    if (elevenVoiceSelect && s.elevenLabsVoiceId) elevenVoiceSelect.value = s.elevenLabsVoiceId;
    if (elevenModelSelect && s.elevenLabsModelId) elevenModelSelect.value = s.elevenLabsModelId;
    if (elevenCustomVoiceInput && s.customVoiceId) elevenCustomVoiceInput.value = s.customVoiceId;

    onElevenVoiceSelect(s.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM');
    toggleProviderInputs(provider);
    updateInterviewModelBadge(provider, s);
    updateInterviewVoiceBadge(s.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM', s.elevenLabsApiKey);
  } catch (e) {
    console.error(e);
  }
}

function onElevenVoiceSelect(val) {
  const customWrap = document.getElementById('customVoiceIdWrap');
  if (customWrap) {
    customWrap.style.display = val === 'custom' ? 'block' : 'none';
  }
  updateInterviewVoiceBadge(val);
}

function updateInterviewVoiceBadge(voiceId, hasKey) {
  const badgeText = document.getElementById('interviewVoiceBadgeText');
  if (!badgeText) return;

  const voices = {
    '21m00Tcm4TlvDq8ikWAM': 'Rachel',
    'nPczCjzI2devNBz1zQrb': 'Brian',
    'pNInz6obpgDQGcFmaJgB': 'Adam',
    'JBFqnCBsd6RMkjVDRZzb': 'George',
    'EXAVITQu4vr4xnSDxMaL': 'Sarah',
    'custom': 'Custom Voice'
  };

  const name = voices[voiceId] || 'Rachel';
  badgeText.textContent = `ElevenLabs: ${name}`;
}

let testAudioPlayer = null;
async function testElevenLabsVoice() {
  const apiKey = document.getElementById('settingElevenLabsApiKey')?.value?.trim();
  let voiceId = document.getElementById('settingElevenLabsVoiceId')?.value;
  if (voiceId === 'custom') {
    voiceId = document.getElementById('settingCustomVoiceId')?.value?.trim() || '21m00Tcm4TlvDq8ikWAM';
  }
  const modelId = document.getElementById('settingElevenLabsModelId')?.value || 'eleven_turbo_v2_5';
  const statusEl = document.getElementById('elevenLabsTestStatus');

  if (!apiKey) {
    showToast('Please enter your ElevenLabs API key first to synthesize speech!', 'error');
    if (statusEl) {
      statusEl.style.display = 'inline-block';
      statusEl.className = 'tape-tag hot';
      statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Key Required';
    }
    return;
  }

  if (statusEl) {
    statusEl.style.display = 'inline-block';
    statusEl.className = 'tape-tag';
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating Audio Sample...';
  }

  showToast('Connecting to ElevenLabs Neural Voice API...');

  try {
    const res = await apiRequest('/api/settings/test-elevenlabs', {
      method: 'POST',
      body: JSON.stringify({ apiKey, voiceId, modelId })
    });

    if (res.success && res.audioDataUrl) {
      showToast('Audio sample synthesized! Playing sample now.');
      if (statusEl) {
        statusEl.className = 'tape-tag verified';
        statusEl.innerHTML = '<i class="fa-solid fa-volume-high"></i> Voice Connected & Active';
      }

      if (testAudioPlayer) {
        testAudioPlayer.pause();
        testAudioPlayer = null;
      }
      testAudioPlayer = new Audio(res.audioDataUrl);
      testAudioPlayer.play().catch(e => console.warn('Autoplay notice:', e));
    } else {
      showToast(res.error || 'ElevenLabs synthesis failed', 'error');
      if (statusEl) {
        statusEl.className = 'tape-tag hot';
        statusEl.innerHTML = '<i class="fa-solid fa-xmark"></i> Synthesis Failed';
      }
    }
  } catch (err) {
    showToast(err.message || 'ElevenLabs API call failed', 'error');
    if (statusEl) {
      statusEl.className = 'tape-tag hot';
      statusEl.innerHTML = '<i class="fa-solid fa-xmark"></i> Connection Failed';
    }
  }
}

async function saveSettings() {
  const aiProvider = document.getElementById('settingAiProvider')?.value || 'builtin';
  const geminiApiKey = document.getElementById('settingGeminiApiKey')?.value?.trim() || '';
  const geminiModel = document.getElementById('settingGeminiModel')?.value || 'gemini-1.5-flash';
  const claudeApiKey = document.getElementById('settingClaudeApiKey')?.value?.trim() || '';
  const claudeModel = document.getElementById('settingClaudeModel')?.value || 'claude-3-5-sonnet-20241022';
  const ollamaEndpoint = document.getElementById('settingOllamaUrl')?.value?.trim() || 'http://localhost:11434';
  const ollamaModel = document.getElementById('settingOllamaModel')?.value?.trim() || 'llama3';
  const autoSpeakTTS = document.getElementById('settingAutoTts')?.checked !== false;

  // ElevenLabs settings
  const elevenLabsApiKey = document.getElementById('settingElevenLabsApiKey')?.value?.trim() || '';
  let elevenLabsVoiceId = document.getElementById('settingElevenLabsVoiceId')?.value || '21m00Tcm4TlvDq8ikWAM';
  const customVoiceId = document.getElementById('settingCustomVoiceId')?.value?.trim() || '';
  const elevenLabsModelId = document.getElementById('settingElevenLabsModelId')?.value || 'eleven_turbo_v2_5';

  try {
    await apiRequest('/api/settings', {
      method: 'POST',
      body: JSON.stringify({
        aiProvider,
        geminiApiKey,
        geminiModel,
        claudeApiKey,
        claudeModel,
        ollamaEndpoint,
        ollamaModel,
        autoSpeakTTS,
        elevenLabsApiKey,
        elevenLabsVoiceId,
        elevenLabsModelId,
        customVoiceId
      })
    });
    showToast('System configuration & ElevenLabs settings saved.');
    updateInterviewModelBadge(aiProvider, { geminiModel, claudeModel, ollamaModel });
    updateInterviewVoiceBadge(elevenLabsVoiceId, elevenLabsApiKey);
  } catch (err) {
    console.error(err);
    showToast('Failed to save settings: ' + err.message, 'error');
  }
}

// Desktop Window Simulation Helpers
function minimizeAppWindow() {
  showToast('Window minimized to Windows taskbar.');
}
function maximizeAppWindow() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
function closeAppWindow() {
  if (confirm('Exit Placement Readiness Copilot?')) {
    window.close();
  }
}

// App Bootstrapping
window.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await loadInitialProfiles();
  if (window.PersonalityStudio) {
    PersonalityStudio.init();
  }
});
