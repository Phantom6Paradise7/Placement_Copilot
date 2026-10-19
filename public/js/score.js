// Module 4: Placement Readiness Score Calculator & Visualizer
function renderReadinessScore(readiness) {
  if (!readiness) return;

  const total = readiness.totalScore || 0;
  const level = readiness.readinessLevel || 'Not ready';

  // 1. Update SVG Score Ring
  const circle = document.getElementById('scoreRingCircle');
  const numberEl = document.getElementById('dashTotalScore');
  const badgeEl = document.getElementById('dashReadinessBadge');
  const levelEl = document.getElementById('dashReadinessLevel');
  const navTag = document.getElementById('navScoreTag');
  const sidebarBadge = document.getElementById('sidebarScoreBadge');

  if (numberEl) numberEl.textContent = total;
  if (navTag) navTag.textContent = total;
  if (sidebarBadge) sidebarBadge.textContent = `${total}/100`;

  // Circumference = 2 * PI * 66 ≈ 414.69
  const circumference = 414.69;
  const offset = circumference - (total / 100) * circumference;

  let strokeColor = '#ef4444'; // Red (Not ready: 0-49)
  let badgeBg = 'var(--danger-bg)';
  let badgeBorder = 'var(--danger-border)';
  let iconClass = 'fa-triangle-exclamation';

  if (total >= 75) {
    strokeColor = '#10b981'; // Green (Placement ready: 75-100)
    badgeBg = 'var(--success-bg)';
    badgeBorder = 'var(--success-border)';
    iconClass = 'fa-circle-check';
  } else if (total >= 50) {
    strokeColor = '#f59e0b'; // Amber (Almost ready: 50-74)
    badgeBg = 'var(--warning-bg)';
    badgeBorder = 'var(--warning-border)';
    iconClass = 'fa-clock';
  }

  if (circle) {
    circle.style.stroke = strokeColor;
    circle.style.strokeDashoffset = offset;
  }

  if (badgeEl && levelEl) {
    badgeEl.style.background = badgeBg;
    badgeEl.style.color = strokeColor;
    badgeEl.style.border = `1px solid ${badgeBorder}`;
    badgeEl.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${level}</span>`;
  }

  const summaryEl = document.getElementById('dashReadinessSummary');
  if (summaryEl) {
    if (total >= 75) {
      summaryEl.textContent = 'High likelihood of clearing Tier-1 placement rounds at Atlassian, Cisco, and Morgan Stanley.';
    } else if (total >= 50) {
      summaryEl.textContent = 'Almost placement ready! A few targeted improvements in project demos or mock interviews will cross the 75-point threshold.';
    } else {
      summaryEl.textContent = 'Critical gaps identified in resume layout, missing live links, or coding practice. Urgent action required.';
    }
  }

  // 2. Render 7-Component Breakdown Bars
  renderBreakdownBars(readiness.breakdown);

  // 3. Render Top 5 Highest-Impact Actions
  renderTop5Actions(readiness.top5Actions);
}

function renderBreakdownBars(breakdown) {
  const container = document.getElementById('breakdownBarsContainer');
  if (!container || !breakdown) return;

  const components = [
    { key: 'resume', label: 'Resume Quality', icon: 'fa-file-lines', weightText: '25% Weight' },
    { key: 'projects', label: 'Projects (Live & Documented)', icon: 'fa-cubes', weightText: '25% Weight' },
    { key: 'mockInterview', label: 'AI Mock Interview Performance', icon: 'fa-headset', weightText: '20% Weight' },
    { key: 'github', label: 'GitHub Activity & Hygiene', icon: 'fa-brands fa-github', weightText: '10% Weight' },
    { key: 'codingPractice', label: 'Coding Practice (LeetCode)', icon: 'fa-code', weightText: '10% Weight' },
    { key: 'linkedIn', label: 'LinkedIn Profile Optimization', icon: 'fa-brands fa-linkedin', weightText: '5% Weight' },
    { key: 'coCurricular', label: 'Co-curricular & Hackathons', icon: 'fa-trophy', weightText: '5% Weight' }
  ];

  let html = '';
  components.forEach(comp => {
    const item = breakdown[comp.key] || { rawScore: 0, weightedScore: 0, maxPoints: 25 };
    const pct = Math.min(100, Math.max(0, item.rawScore));

    let barColor = '#ef4444';
    if (pct >= 75) barColor = '#10b981';
    else if (pct >= 50) barColor = '#f59e0b';

    html += `
      <div class="breakdown-item">
        <div class="breakdown-item-header">
          <div class="breakdown-item-name">
            <i class="${comp.icon}" style="color: var(--accent-cyan); width: 16px;"></i>
            <span>${comp.label}</span>
            <span class="breakdown-item-weight">${comp.weightText}</span>
          </div>
          <div class="breakdown-item-scores">
            <span>${item.weightedScore} / ${item.maxPoints} pts</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: normal; margin-left: 4px;">(${item.rawScore}%)</span>
          </div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderTop5Actions(actions) {
  const container = document.getElementById('top5ActionsContainer');
  if (!container) return;

  if (!actions || actions.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--success); font-weight: 600;">
        <i class="fa-solid fa-trophy" style="font-size: 28px; margin-bottom: 8px; display: block;"></i>
        All placement benchmarks mastered! You are in the top tier for upcoming campus drives.
      </div>
    `;
    return;
  }

  let html = '';
  actions.forEach((act, idx) => {
    html += `
      <div class="action-card">
        <div class="action-left">
          <div class="action-rank">#${idx + 1}</div>
          <div>
            <div class="action-category-chip">${act.category} • ${act.priority || 'High'} Priority</div>
            <div class="action-text">${act.action}</div>
          </div>
        </div>
        <div class="action-right">
          <div class="gain-chip">
            <i class="fa-solid fa-arrow-trend-up"></i> +${act.potentialGain || 5} pts
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
