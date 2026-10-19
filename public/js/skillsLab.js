// Module: Student Areas of Interest & Custom Tech Skills Lab
const DOMAIN_INTERESTS = [
  { id: 'fullstack', name: 'Full Stack Web Development', icon: 'fa-layer-group', desc: 'React, Next.js, Node.js, REST & WebSockets' },
  { id: 'aiml', name: 'AI, LLMs & Generative Models', icon: 'fa-brain', desc: 'PyTorch, RAG pipelines, fine-tuning, LangChain' },
  { id: 'cloud', name: 'Cloud Architecture & DevOps', icon: 'fa-cloud', desc: 'Docker, Kubernetes, AWS, CI/CD pipelines' },
  { id: 'systems', name: 'Systems & Low-Latency Engineering', icon: 'fa-microchip', desc: 'C++, Rust, Concurrency, Redis, Network Sockets' },
  { id: 'mobile', name: 'Mobile App Development', icon: 'fa-mobile-screen', desc: 'React Native, Flutter, Swift, Android Studio' },
  { id: 'security', name: 'Cybersecurity & Pen Testing', icon: 'fa-shield-halved', desc: 'OWASP, Network auditing, Cryptography' },
  { id: 'data', name: 'Data Engineering & Analytics', icon: 'fa-database', desc: 'PostgreSQL, Apache Kafka, Spark, ETL pipelines' },
  { id: 'blockchain', name: 'Blockchain & Distributed Ledgers', icon: 'fa-cubes', desc: 'Solidity, Smart contracts, Web3.js' }
];

async function loadSkillsLab() {
  const profile = window.AppState.activeProfile;
  if (!profile) return;

  renderInterestsGrid(profile.interests || ['Full Stack Web Development', 'Cloud Architecture & DevOps']);
  renderCustomSkillsList(profile.customSkills || []);
}

function renderInterestsGrid(selectedList) {
  const container = document.getElementById('interestsGridContainer');
  if (!container) return;

  let html = '';
  DOMAIN_INTERESTS.forEach(domain => {
    const isSelected = selectedList.includes(domain.name) || selectedList.includes(domain.id);
    html += `
      <div class="interest-card ${isSelected ? 'selected' : ''}" onclick="toggleInterestSelection('${domain.name}')">
        <div style="font-size: 22px; color: ${isSelected ? 'var(--cyan-light)' : 'var(--text-muted)'};">
          <i class="fa-solid ${domain.icon}"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 700; color: #fff;">${domain.name}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${domain.desc}</div>
        </div>
        <div>
          <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle-plus'}" style="color: ${isSelected ? 'var(--cyan-light)' : 'var(--text-muted)'}; font-size: 16px;"></i>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

async function toggleInterestSelection(domainName) {
  const profile = window.AppState.activeProfile;
  if (!profile) return;

  profile.interests = profile.interests || [];
  const idx = profile.interests.indexOf(domainName);
  if (idx >= 0) {
    profile.interests.splice(idx, 1);
  } else {
    profile.interests.push(domainName);
  }

  renderInterestsGrid(profile.interests);

  try {
    await apiRequest('/api/profile/interests', {
      method: 'POST',
      body: JSON.stringify({
        studentId: profile.id,
        interests: profile.interests
      })
    });
    showToast(`Updated areas of interest: ${domainName}`);
  } catch (err) {
    console.error(err);
  }
}

// Custom Skills (What student likes to do if not available in app)
function renderCustomSkillsList(customSkills) {
  const container = document.getElementById('customSkillsListContainer');
  if (!container) return;

  if (!customSkills || customSkills.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); font-size: 12.5px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md);">
        No custom tech skills registered yet. If you work with unique tools (e.g. LangChain, Zig, Tauri, Kafka), add them below with what you like to do with them!
      </div>
    `;
    return;
  }

  let html = '';
  customSkills.forEach(s => {
    html += `
      <div style="background: rgba(6, 182, 212, 0.08); border: 1.5px solid var(--cyan-border); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="tape-tag" style="background: var(--cyan-primary); color: #020817; font-size: 12px;">${s.name}</span>
            <span class="app-meta-pill">${s.category || 'Specialized Tech'}</span>
            <span class="app-meta-pill" style="color: #38bdf8;">Proficiency: ${s.proficiency || 'Advanced'}</span>
          </div>
          ${s.likesToDo ? `
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">
              <strong>What I like to do:</strong> "${s.likesToDo}"
            </div>
          ` : ''}
        </div>
        <button onclick="removeCustomSkill('${encodeURIComponent(s.name)}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Remove skill">
          <i class="fa-solid fa-trash-can" style="color: #ef4444;"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

async function addCustomTechSkill() {
  const nameInput = document.getElementById('customSkillName');
  const catInput = document.getElementById('customSkillCategory');
  const profInput = document.getElementById('customSkillProficiency');
  const likesInput = document.getElementById('customSkillLikesToDo');

  const skillName = (nameInput?.value || '').trim();
  const category = catInput?.value || 'Specialized Tech';
  const proficiency = profInput?.value || 'Intermediate';
  const likesToDo = (likesInput?.value || '').trim();

  if (!skillName) {
    showToast('Please enter the tech skill or framework name.', 'error');
    return;
  }

  const profile = window.AppState.activeProfile;
  if (!profile) return;

  try {
    const res = await apiRequest('/api/profile/custom-skill', {
      method: 'POST',
      body: JSON.stringify({
        studentId: profile.id,
        skillName,
        category,
        proficiency,
        likesToDo
      })
    });

    profile.customSkills = res.customSkills;
    renderCustomSkillsList(res.customSkills);

    if (nameInput) nameInput.value = '';
    if (likesInput) likesInput.value = '';

    showToast(`Added "${skillName}" to your placement profile!`);

    if (res.readiness) {
      window.AppState.readiness = res.readiness;
      renderReadinessScore(res.readiness);
      updateSidebarGlance(profile, res.readiness);
    }
  } catch (err) {
    console.error(err);
  }
}

async function removeCustomSkill(encodedSkillName) {
  const profile = window.AppState.activeProfile;
  if (!profile) return;

  try {
    const res = await apiRequest(`/api/profile/custom-skill/${encodedSkillName}?studentId=${profile.id}`, {
      method: 'DELETE'
    });
    profile.customSkills = res.customSkills;
    renderCustomSkillsList(res.customSkills);
    showToast('Custom skill removed.');

    if (res.readiness) {
      window.AppState.readiness = res.readiness;
      renderReadinessScore(res.readiness);
      updateSidebarGlance(profile, res.readiness);
    }
  } catch (err) {
    console.error(err);
  }
}
