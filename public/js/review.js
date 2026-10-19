// Module 2: Benchmark Review Engine
function renderReviewEngine(reviewData) {
  if (!reviewData) return;

  renderResumeTab(reviewData.resume);
  renderLinkedInTab(reviewData.linkedIn);
  renderGitHubTab(reviewData.github);
  renderLiveLinksTab(reviewData.projects);
}

function switchReviewTab(tabId) {
  // Update button classes
  const buttons = document.querySelectorAll('.review-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event?.currentTarget?.classList.add('active');

  // Show selected pane
  const panes = ['resume-benchmarks', 'linkedin-benchmarks', 'github-benchmarks', 'live-links-benchmarks'];
  panes.forEach(p => {
    const el = document.getElementById(`${p}-pane`);
    if (el) el.style.display = p === tabId ? 'block' : 'none';
  });
}

function renderChecksList(checks, targetPaneId, categoryScore, categoryTitle) {
  const pane = document.getElementById(targetPaneId);
  if (!pane || !checks) return;

  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
      <h4 style="font-family: var(--font-heading); font-size: 15px; font-weight: 700;">${categoryTitle}</h4>
      <div style="font-size: 14px; font-weight: 700; color: ${categoryScore >= 75 ? 'var(--success)' : (categoryScore >= 50 ? 'var(--warning)' : 'var(--danger)')};">
        Score: ${categoryScore}%
      </div>
    </div>
  `;

  checks.forEach(chk => {
    const isPass = chk.passed;
    html += `
      <div class="benchmark-card ${isPass ? 'pass' : 'fail'}">
        <div class="benchmark-title-row">
          <div class="benchmark-name">
            <i class="fa-solid ${isPass ? 'fa-check' : 'fa-xmark'}" style="color: ${isPass ? 'var(--success)' : 'var(--danger)'}; margin-right: 8px;"></i>
            ${chk.name}
          </div>
          <span class="benchmark-badge ${isPass ? 'pass' : 'fail'}">
            ${isPass ? 'PASSED' : 'ACTION REQUIRED'}
          </span>
        </div>
        <div class="benchmark-finding">${chk.finding}</div>
        ${!isPass && chk.fix ? `
          <div class="benchmark-fix">
            <i class="fa-solid fa-wrench" style="margin-top: 2px;"></i>
            <div><strong>Specific Fix:</strong> ${chk.fix}</div>
          </div>
        ` : ''}
      </div>
    `;
  });

  pane.innerHTML = html;
}

function renderResumeTab(resumeReview) {
  if (!resumeReview) return;
  renderChecksList(
    resumeReview.checks,
    'resume-benchmarks-pane',
    resumeReview.score,
    'Resume Quality & ATS Benchmark Checks'
  );
}

function renderLinkedInTab(linkedInReview) {
  if (!linkedInReview) return;
  const pane = document.getElementById('linkedin-benchmarks-pane');
  if (!pane) return;

  renderChecksList(
    linkedInReview.checks,
    'linkedin-benchmarks-pane',
    linkedInReview.score,
    'LinkedIn Profile Alignment & Role Keywords'
  );

  // Append ready-to-paste rewrites
  if (linkedInReview.rewrites) {
    const rewritesHtml = `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
        <h4 style="font-family: var(--font-heading); font-size: 14.5px; font-weight: 700; margin-bottom: 8px;">
          <i class="fa-solid fa-sparkles" style="color: var(--accent-cyan);"></i> Ready-to-Paste Profile Rewrites
        </h4>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          Generated directly for your target role. Copy and paste into LinkedIn for immediate profile optimization.
        </p>

        <!-- Headline Rewrite -->
        <div style="margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Recommended Headline</span>
          <div class="paste-box" style="margin-top: 4px;">
            <div class="paste-box-content" id="linkedInHeadlinePaste">${linkedInReview.rewrites.headline}</div>
            <button class="btn btn-secondary btn-sm paste-copy-btn" onclick="copyTextFromElement('linkedInHeadlinePaste')">
              <i class="fa-solid fa-copy"></i> Copy Headline
            </button>
          </div>
        </div>

        <!-- About Rewrite -->
        <div>
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">Recommended About Section</span>
          <div class="paste-box" style="margin-top: 4px;">
            <div class="paste-box-content" id="linkedInAboutPaste">${linkedInReview.rewrites.about}</div>
            <button class="btn btn-secondary btn-sm paste-copy-btn" onclick="copyTextFromElement('linkedInAboutPaste')">
              <i class="fa-solid fa-copy"></i> Copy About
            </button>
          </div>
        </div>
      </div>
    `;
    pane.insertAdjacentHTML('beforeend', rewritesHtml);
  }
}

function renderGitHubTab(githubReview) {
  if (!githubReview) return;
  renderChecksList(
    githubReview.checks,
    'github-benchmarks-pane',
    githubReview.score,
    'GitHub Hygiene, Commit Activity & Codebase Quality'
  );
}

function renderLiveLinksTab(projectsReview) {
  if (!projectsReview) return;
  renderChecksList(
    projectsReview.checks,
    'live-links-benchmarks-pane',
    projectsReview.score,
    'Live Web Deployments & Engineering Tests'
  );
}

async function runComprehensiveReview() {
  const profileId = window.AppState.activeProfile?.id;
  if (!profileId) return;

  showToast('Running placement benchmarks audit across all 4 categories...');
  try {
    const res = await apiRequest(`/api/review/${profileId}`, { method: 'POST' });
    window.AppState.review = res;
    renderReviewEngine(res);
    if (res.readiness) {
      window.AppState.readiness = res.readiness;
      renderReadinessScore(res.readiness);
    }
    showToast('Comprehensive review completed!');
  } catch (err) {
    console.error(err);
  }
}

function copyTextFromElement(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText || el.textContent);
  showToast('Copied ready-to-paste text to clipboard!');
}
