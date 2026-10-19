// Module: Staff Placement Control Center & Opportunity Broadcast Hub
let currentStaffBroadcasts = [];
let activeStaffTab = 'all';

async function loadStaffBroadcasts() {
  try {
    const res = await apiRequest(`/api/staff/broadcasts?category=${activeStaffTab}`);
    currentStaffBroadcasts = res.broadcasts || [];
    renderStaffBroadcastCards(currentStaffBroadcasts);
  } catch (err) {
    console.error('Failed to load staff broadcasts:', err);
  }
}

function switchStaffBroadcastTab(tab) {
  activeStaffTab = tab;
  document.querySelectorAll('.staff-tab-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  loadStaffBroadcasts();
}

function renderStaffBroadcastCards(items) {
  const container = document.getElementById('staffBroadcastsContainer');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1.5px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 36px; text-align: center; grid-column: 1 / -1;">
        <i class="fa-solid fa-bullhorn" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
        <h4 style="font-size: 16px; font-weight: 700; color: #fff;">No broadcast listings in this category</h4>
        <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Staff can click "Broadcast New Opportunity" to post updates.</p>
      </div>
    `;
    return;
  }

  const userScore = window.AppState.readiness?.totalScore || 70;

  let html = '';
  items.forEach(item => {
    const isEligible = userScore >= (item.minScore || 0);
    const typeLabel = {
      job: 'Campus Job Drive',
      internship: 'Summer/Winter Internship',
      hackathon: 'Hackathon & Challenge',
      resumeBooster: 'Resume Clinic & Booster'
    }[item.type] || 'Campus Opportunity';

    const typeColor = {
      job: 'var(--cyan-primary)',
      internship: '#38bdf8',
      hackathon: '#f59e0b',
      resumeBooster: '#10b981'
    }[item.type] || 'var(--cyan-primary)';

    html += `
      <div class="job-item-card" style="border-top: 3.5px solid ${typeColor};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="tape-tag" style="background: rgba(6, 182, 212, 0.1); border-color: ${typeColor}; color: ${typeColor}; font-size: 10px; margin-bottom: 6px;">
                ${typeLabel.toUpperCase()}
              </span>
              <h4 style="font-size: 16px; font-weight: 800; color: #fff; margin-top: 4px;">${item.title}</h4>
              <div style="font-size: 13px; font-weight: 700; color: var(--cyan-light); margin-top: 2px;">
                <i class="fa-solid fa-building" style="font-size: 11px; margin-right: 4px;"></i>${item.company}
              </div>
            </div>
            ${item.minScore > 0 ? `
              <span class="tape-tag ${isEligible ? 'verified' : 'hot'}" style="font-size: 10.5px;">
                Min Score: ${item.minScore}+
              </span>
            ` : `
              <span class="tape-tag verified" style="font-size: 10.5px;">OPEN TO ALL</span>
            `}
          </div>

          <div style="display: flex; gap: 10px; font-size: 11.5px; margin: 10px 0; flex-wrap: wrap;">
            <span class="app-meta-pill" style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-gift"></i> ${item.stipend}</span>
            <span class="app-meta-pill"><i class="fa-regular fa-calendar"></i> Deadline: ${item.deadline}</span>
            <span class="app-meta-pill"><i class="fa-solid fa-users"></i> ${item.applicantsCount || 0} Students Applied</span>
          </div>

          <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
            ${item.description}
          </p>

          <div class="skills-tags-wrap">
            ${(item.tags || []).map(t => `<span class="skill-tag">${t}</span>`).join('')}
          </div>

          <div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
            <i class="fa-solid fa-user-tie"></i> Posted by: <strong>${item.postedBy}</strong> on ${item.postedAt}
          </div>
        </div>

        <div style="margin-top: 16px; display: flex; gap: 8px;">
          ${window.AppState.isMsotAdmin ? `
            <button class="btn btn-danger btn-sm" style="flex: 1;" onclick="deleteStaffBroadcast('${item.id}')">
              <i class="fa-solid fa-trash-can"></i> Delete Listing
            </button>
          ` : isEligible ? `
            <button class="btn btn-success btn-sm" style="flex: 1;" onclick="applyToStaffBroadcast('${item.id}', '${item.company}', '${item.title}')">
              <i class="fa-solid fa-paper-plane"></i> 1-Click Register / Apply
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" style="flex: 1; opacity: 0.7; cursor: not-allowed;" title="Raise placement score to unlock">
              <i class="fa-solid fa-lock"></i> Requires Score ${item.minScore}
            </button>
          `}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Student 1-click apply to staff broadcast
async function applyToStaffBroadcast(broadcastId, company, role) {
  const profile = window.AppState.activeProfile;
  if (!profile) return;

  const newApp = {
    studentId: profile.id,
    company,
    role,
    stipend: 'MSOT Verified Opportunity',
    appliedDate: new Date().toISOString().slice(0, 10),
    status: 'Applied',
    followUpDate: '2026-11-20',
    notes: 'Applied through MSOT Staff Opportunity Broadcast Hub.'
  };

  try {
    await apiRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify(newApp)
    });
    showToast(`Registered & applied for ${company} - ${role}!`);
  } catch (err) {
    console.error(err);
  }
}

// Staff Broadcast Modal & Form
function openBroadcastOpportunityModal() {
  openModal('broadcastOpportunityModal');
}

async function submitStaffBroadcast() {
  const type = document.getElementById('bcastType')?.value || 'job';
  const title = document.getElementById('bcastTitle')?.value?.trim();
  const company = document.getElementById('bcastCompany')?.value?.trim();
  const stipend = document.getElementById('bcastStipend')?.value?.trim();
  const minScore = parseInt(document.getElementById('bcastMinScore')?.value || '0', 10);
  const deadline = document.getElementById('bcastDeadline')?.value || '';
  const description = document.getElementById('bcastDescription')?.value?.trim();
  const tagsStr = document.getElementById('bcastTags')?.value?.trim() || '';

  if (!title || !company) {
    showToast('Title and Company/Host are required.', 'error');
    return;
  }

  const payload = {
    type,
    title,
    company,
    stipend: stipend || 'Competitive Stipend / Prizes',
    minScore,
    deadline: deadline || '2026-11-20',
    description: description || 'Exclusive opportunity posted by MSOT Placement Staff.',
    tags: tagsStr.split(',').map(s => s.trim()).filter(Boolean),
    postedBy: 'MSOT Placement Cell Staff'
  };

  try {
    await apiRequest('/api/staff/broadcasts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(`Broadcasted "${title}" to all students!`);
    closeModal('broadcastOpportunityModal');
    loadStaffBroadcasts();
  } catch (err) {
    console.error('Failed to broadcast:', err);
  }
}

async function deleteStaffBroadcast(id) {
  if (!confirm('Are you sure you want to remove this broadcast?')) return;
  try {
    await apiRequest(`/api/staff/broadcasts/${id}`, { method: 'DELETE' });
    showToast('Broadcast listing removed.');
    loadStaffBroadcasts();
  } catch (err) {
    console.error(err);
  }
}
