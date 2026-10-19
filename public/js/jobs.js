// Module 5: Naukri-Style College Job Discovery with Global LLM Boolean Search Engine
let currentSearchResults = [];
let activeFilters = {
  category: 'all',
  workMode: 'all',
  minMatch: 0
};

// Initialize Job Discovery View
async function loadJobDiscoveryData() {
  const profile = window.AppState.activeProfile;
  const searchInput = document.getElementById('globalSearchInput');

  // Keep search box clean and empty by default per user request
  if (searchInput && !searchInput.dataset.userEdited) {
    searchInput.value = '';
  }

  await executeGlobalJobSearch();
}

// Execute Global LLM Boolean Search across jobs pool
async function executeGlobalJobSearch() {
  const query = document.getElementById('globalSearchInput')?.value?.trim() || '';
  const profile = window.AppState.activeProfile;
  const statusTicker = document.getElementById('llmScanStatusTicker');

  if (statusTicker) {
    statusTicker.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color: var(--cyan-light);"></i> Scanning 42,800+ opportunities across global LLM nodes using semantic embeddings...`;
  }

  try {
    const res = await apiRequest('/api/jobs/global-search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        category: activeFilters.category,
        workMode: activeFilters.workMode,
        minMatch: activeFilters.minMatch,
        studentId: profile?.id
      })
    });

    currentSearchResults = res.results || [];
    renderNaukriJobBoxes(currentSearchResults);

    if (statusTicker) {
      statusTicker.innerHTML = `
        <i class="fa-solid fa-bolt" style="color: var(--cyan-light);"></i> 
        Found <strong>${res.totalFound} matched opportunities</strong> across <strong>${res.llmSearchNodesScanned.toLocaleString()} nodes</strong> (${res.searchLatencyMs}ms)
      `;
    }
  } catch (err) {
    console.error('Job search error:', err);
    if (statusTicker) {
      statusTicker.innerHTML = `<span style="color: var(--danger);">Search failed: ${err.message}</span>`;
    }
  }
}

// Quick Boolean Operator Inserter
function insertBooleanOperator(op) {
  const input = document.getElementById('globalSearchInput');
  if (!input) return;

  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  let insertText = ` ${op} `;

  if (op === '()') insertText = ' () ';
  if (op === '""') insertText = ' "" ';

  input.value = text.substring(0, start) + insertText + text.substring(end);
  input.focus();
  input.selectionStart = start + insertText.length;
  input.selectionEnd = start + insertText.length;
}

// Filter handlers
function applyNaukriCategoryFilter(cat) {
  activeFilters.category = cat;
  // Update button classes
  document.querySelectorAll('.filter-tab-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
  });
  executeGlobalJobSearch();
}

function applyWorkModeFilter(mode) {
  activeFilters.workMode = mode;
  executeGlobalJobSearch();
}

function applyMatchFilter(minScore) {
  activeFilters.minMatch = parseInt(minScore, 10);
  executeGlobalJobSearch();
}

// Render Naukri.com-Style College Job Boxes
function renderNaukriJobBoxes(jobs) {
  const container = document.getElementById('naukriJobCardsContainer');
  if (!container) return;

  if (!jobs || jobs.length === 0) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1.5px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 36px; text-align: center;">
        <i class="fa-solid fa-briefcase" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
        <h4 style="font-size: 16px; font-weight: 700; color: #fff;">No opportunities match this Boolean criteria</h4>
        <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Try loosening the filter or using OR operators in your search box.</p>
      </div>
    `;
    return;
  }

  let html = '';
  jobs.forEach(job => {
    const isPpo = (job.stipend || '').includes('PPO') || (job.title || '').includes('PPO');

    html += `
      <div class="naukri-job-card">
        <div class="tape-strip tape-strip-tr" style="width: 55px; height: 14px;"></div>
        <div class="job-card-header">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="job-title-link">${job.title}</span>
              ${isPpo ? `<span class="tape-tag hot" style="font-size: 10px;">PRE-PLACEMENT OFFER</span>` : ''}
              ${job.source === 'MSOT On-Campus Portal' ? `<span class="tape-tag verified" style="font-size: 10px;">CAMPUS EXCLUSIVE</span>` : ''}
            </div>
            <div class="job-company-name">
              <i class="fa-solid fa-building" style="font-size: 11px; margin-right: 4px;"></i>${job.company}
            </div>
          </div>
          <div style="text-align: right;">
            <span class="tape-tag" style="background: rgba(6, 182, 212, 0.15); font-size: 11.5px;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> ${job.matchScore}% Match
            </span>
          </div>
        </div>

        <div class="job-meta-row">
          <div class="job-meta-item">
            <i class="fa-solid fa-briefcase" style="color: var(--cyan-light);"></i>
            <span>Experience: <strong>0 Yrs (Freshers / 2026 Batch)</strong></span>
          </div>
          <div class="job-meta-item" style="color: #10b981; font-weight: 700;">
            <i class="fa-solid fa-indian-rupee-sign"></i>
            <span>${job.stipend}</span>
          </div>
          <div class="job-meta-item">
            <i class="fa-solid fa-location-dot" style="color: #38bdf8;"></i>
            <span>${job.location}</span>
          </div>
        </div>

        <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px;">
          ${job.description}
        </p>

        <div class="job-skills-wrap">
          ${(job.skills || []).map(s => `<span class="job-skill-pill">${s}</span>`).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 14px;">
          <span style="font-size: 11.5px; color: var(--text-muted);">
            <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${job.posted} • Source: ${job.source}
          </span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="openAutoApplyAssistant('${job.id}')">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Apply Helper
            </button>
            <button class="btn btn-primary btn-sm" onclick="saveDirectApplicationFromJob('${job.id}')">
              <i class="fa-solid fa-paper-plane"></i> 1-Click Track & Apply
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 1-Click Track & Apply directly from search card
async function saveDirectApplicationFromJob(jobId) {
  const job = currentSearchResults.find(j => j.id === jobId);
  const profile = window.AppState.activeProfile;
  if (!job || !profile) return;

  const newApp = {
    studentId: profile.id,
    company: job.company,
    role: job.title,
    location: job.location,
    stipend: job.stipend,
    appliedDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    followUpDate: '2026-11-15',
    jobUrl: job.url,
    notes: `Applied via Global LLM Job Search. Source: ${job.source}.`
  };

  try {
    await apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify(newApp)
    });
    showToast(`Applied & added ${job.company} to your Application Pipeline Tracker!`);
  } catch (e) {
    console.error(e);
  }
}

// Auto-Apply Assistant Helper
function openAutoApplyAssistant(jobId) {
  const job = currentSearchResults.find(j => j.id === jobId);
  const p = window.AppState.activeProfile;
  if (!job || !p) return;

  const topProj = (p.projects && p.projects[0]) || { name: 'Full-stack platform' };
  const skillsStr = (p.skills?.languages || ['TypeScript', 'Python']).join(', ');

  const snippet = `Dear Hiring Team at ${job.company},

I am excited to apply for the ${job.title} role. As a pre-final year engineering student at MSOT College of Engineering (CGPA: ${p.cgpa || '8.65'}) specializing in ${p.targetRole || 'Full Stack & Systems Development'}, my hands-on background directly matches your requirements.

Relevant Highlights:
• Developed ${topProj.name}: ${topProj.tagline || 'production system'}.
• Algorithmic Disciplines: Solved ${p.leetCode?.totalSolved || 340}+ problems on LeetCode with strong focus on low-latency data structures.
• Stack: ${skillsStr}, ${p.skills?.frontend?.[0] || 'React'}, and ${p.skills?.backend?.[0] || 'Node.js'}.

Profiles:
• GitHub: ${p.github?.profileUrl || 'https://github.com/arjunsharma-dev'}
• LinkedIn: ${p.linkedIn?.profileUrl || 'https://linkedin.com/in/arjun-sharma-tech'}

Looking forward to interviewing with the engineering team.

Warm regards,
${p.name || 'Candidate'}`;

  const snippetEl = document.getElementById('autoApplySnippet');
  if (snippetEl) snippetEl.textContent = snippet;

  const linkBtn = document.getElementById('autoApplyLinkBtn');
  if (linkBtn) linkBtn.href = job.url;

  openModal('autoApplyModal');
}

function copySnippetText() {
  const snippetEl = document.getElementById('autoApplySnippet');
  if (!snippetEl) return;
  navigator.clipboard.writeText(snippetEl.innerText || snippetEl.textContent);
  showToast('Copied personalized application note to clipboard!');
}

// Kanban Application Tracker
const STAGES = ['Saved', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

async function loadApplications() {
  const profileId = window.AppState.activeProfile?.id;
  try {
    const list = await apiRequest(`/api/applications?studentId=${profileId || ''}`);
    renderKanbanBoard(list || []);
  } catch (err) {
    console.error(err);
  }
}

function renderKanbanBoard(apps) {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  let html = '';
  STAGES.forEach(stage => {
    const stageApps = apps.filter(a => a.status === stage);
    html += `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${stage}</span>
          <span class="kanban-badge">${stageApps.length}</span>
        </div>
        <div class="kanban-cards-wrap" style="display: flex; flex-direction: column; gap: 8px;">
          ${stageApps.map(a => renderAppCard(a)).join('')}
        </div>
      </div>
    `;
  });

  board.innerHTML = html;
}

function renderAppCard(app) {
  return `
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="app-company">${app.company}</span>
        <button onclick="deleteApplication('${app.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer;" title="Remove application">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="app-role">${app.role}</div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
        <span class="app-meta-pill"><i class="fa-solid fa-location-dot"></i> ${app.location || 'Bengaluru'}</span>
        ${app.stipend ? `<span class="app-meta-pill" style="color: var(--cyan-light);">${app.stipend}</span>` : ''}
      </div>
      ${app.notes ? `<div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">${app.notes}</div>` : ''}

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px;">
        <span style="font-size: 10px; color: var(--text-muted);">Stage:</span>
        <select onchange="updateApplicationStatus('${app.id}', this.value)" style="background: #090d16; border: 1px solid var(--border-subtle); color: #fff; font-size: 11px; border-radius: 4px; padding: 2px 4px; outline: none; cursor: pointer;">
          ${STAGES.map(s => `<option value="${s}" ${s === app.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

async function updateApplicationStatus(id, newStatus) {
  try {
    await apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ id, status: newStatus })
    });
    showToast(`Updated application stage to "${newStatus}"`);
    loadApplications();
  } catch (err) {
    console.error(err);
  }
}

async function deleteApplication(id) {
  try {
    await apiRequest(`/api/applications/${id}`, { method: 'DELETE' });
    showToast('Application removed.');
    loadApplications();
  } catch (err) {
    console.error(err);
  }
}

function openAddApplicationModal() {
  openModal('addAppModal');
}

async function saveNewApplication() {
  const company = document.getElementById('modalAppCompany')?.value?.trim();
  const role = document.getElementById('modalAppRole')?.value?.trim();
  const stipend = document.getElementById('modalAppStipend')?.value?.trim();
  const status = document.getElementById('modalAppStatus')?.value || 'Applied';
  const followUpDate = document.getElementById('modalAppFollowUp')?.value || '';
  const notes = document.getElementById('modalAppNotes')?.value?.trim() || '';

  if (!company || !role) {
    showToast('Company name and role are required.', 'error');
    return;
  }

  const newApp = {
    studentId: window.AppState.activeProfile?.id,
    company,
    role,
    stipend,
    status,
    followUpDate,
    notes,
    appliedDate: new Date().toISOString().slice(0, 10),
    jobUrl: '#'
  };

  try {
    await apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify(newApp)
    });
    showToast(`Application for ${company} added to tracker!`);
    closeModal('addAppModal');
    loadApplications();
  } catch (err) {
    console.error(err);
  }
}
