// ==========================================================================
// SWEETTAPE CAREER PERSONALITY BUILDER & IDENTITY STUDIO
// Engineering Archetypes, Trait Matrix, AI Elevator Pitch, and Portfolio Identity
// ==========================================================================

const PersonalityStudio = {
  activeArchetype: 'The Full-Stack Architect',
  traits: {
    architectureDepth: 88,
    problemSolving: 92,
    productEmpathy: 80,
    engineeringSpeed: 85,
    communication: 86
  },

  archetypes: [
    {
      id: 'fullstack',
      name: 'The Full-Stack Architect',
      tagline: 'End-to-End System Thinker',
      color: '#06b6d4',
      icon: 'fa-cubes-stacked',
      description: 'Bridges frontend elegance with distributed backend reliability. Balances database trade-offs, API latency, and responsive UI components.',
      recommendedFor: 'SDE-1, Full Stack Roles, Founding Engineers'
    },
    {
      id: 'ai-ml',
      name: 'The AI & Machine Learning Innovator',
      tagline: 'Model Weights & Vector Pipelines',
      color: '#10b981',
      icon: 'fa-brain',
      description: 'Designs predictive algorithms, neural network pipelines, RAG agents, and embeddings to solve data-rich campus and enterprise problems.',
      recommendedFor: 'AI Engineer, Data Scientist, ML Systems'
    },
    {
      id: 'devops-sre',
      name: 'The Cloud & DevOps SRE',
      tagline: 'Zero-Downtime Infrastructure',
      color: '#38bdf8',
      icon: 'fa-server',
      description: 'Obsessed with scalability, containerization, automated CI/CD, monitoring alerts, and zero-drop request backpressure.',
      recommendedFor: 'DevOps Engineer, Cloud Architect, Site Reliability'
    },
    {
      id: 'frontend-ux',
      name: 'The Product & UI/UX Artisan',
      tagline: 'Pixel-Perfection & Micro-Interactions',
      color: '#f59e0b',
      icon: 'fa-pen-ruler',
      description: 'Crafts silky 60fps animations, accessible DOM hierarchies, design systems, and delightful tactile web experiences.',
      recommendedFor: 'Frontend Engineer, UI/UX Technologist'
    },
    {
      id: 'systems-core',
      name: 'The Algorithms & Systems Core',
      tagline: 'Concurrency & Low-Latency Math',
      color: '#2563eb',
      icon: 'fa-microchip',
      description: 'Excels in competitive programming, memory safety, thread pools, lock-free data structures, and kernel-level performance.',
      recommendedFor: 'Backend Core, Quant Dev, Systems Programmer'
    }
  ],

  init() {
    this.renderArchetypeCards();
    this.updateTraitBars();
    this.loadProfilePersonality();
  },

  loadProfilePersonality() {
    const profile = window.AppState.activeProfile;
    if (profile?.personality) {
      this.activeArchetype = profile.personality.archetype || this.activeArchetype;
      this.traits = profile.personality.traits || this.traits;
      const pitchInput = document.getElementById('personalityElevatorPitch');
      if (pitchInput && profile.personality.elevatorPitch) {
        pitchInput.value = profile.personality.elevatorPitch;
      }
      this.renderArchetypeCards();
      this.updateTraitBars();
    }
  },

  renderArchetypeCards() {
    const container = document.getElementById('archetypesGrid');
    if (!container) return;

    container.innerHTML = this.archetypes.map(arc => {
      const isSelected = arc.name === this.activeArchetype;
      return `
        <div class="archetype-card ${isSelected ? 'selected' : ''}" onclick="PersonalityStudio.selectArchetype('${arc.name}')" style="--arc-color: ${arc.color}">
          <div class="tape-strip tape-strip-tl" style="width: 45px; height: 12px;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="archetype-icon" style="color: ${arc.color}; background: rgba(6, 182, 212, 0.1);">
              <i class="fa-solid ${arc.icon}"></i>
            </div>
            ${isSelected ? `<span class="tape-tag verified" style="font-size: 9px;">ACTIVE PERSONA</span>` : ''}
          </div>
          <div class="archetype-name">${arc.name}</div>
          <div class="archetype-tagline">${arc.tagline}</div>
          <p class="archetype-desc">${arc.description}</p>
          <div style="font-size: 10.5px; color: var(--text-muted); margin-top: 8px;">
            Target: <strong style="color: #cbd5e1;">${arc.recommendedFor}</strong>
          </div>
        </div>
      `;
    }).join('');
  },

  selectArchetype(name) {
    this.activeArchetype = name;
    if (window.SweetTape) window.SweetTape.playTapeSound('peel');
    this.renderArchetypeCards();
    this.generateElevatorPitch();
    showToast(`Selected Career Archetype: ${name}`);
  },

  onTraitSliderChange(trait, value) {
    this.traits[trait] = parseInt(value, 10);
    this.updateTraitBars();
  },

  updateTraitBars() {
    for (const [key, val] of Object.entries(this.traits)) {
      const slider = document.getElementById(`slider-${key}`);
      const valDisplay = document.getElementById(`val-${key}`);
      if (slider) slider.value = val;
      if (valDisplay) valDisplay.textContent = `${val}%`;
    }

    // Overall personality balance score
    const avg = Math.round(Object.values(this.traits).reduce((a, b) => a + b, 0) / 5);
    const balanceBadge = document.getElementById('personalityBalanceScore');
    if (balanceBadge) {
      balanceBadge.textContent = `${avg}/100`;
    }
  },

  async generateElevatorPitch() {
    const profile = window.AppState.activeProfile;
    if (!profile) return;

    try {
      const res = await apiRequest('/api/profile/generate-pitch', {
        method: 'POST',
        body: JSON.stringify({
          studentId: profile.id,
          archetype: this.activeArchetype
        })
      });

      const pitchInput = document.getElementById('personalityElevatorPitch');
      if (pitchInput && res.pitch) {
        pitchInput.value = res.pitch;
        // Sync to resume objective / summary
        const rbSummary = document.getElementById('rbSummary');
        if (rbSummary) {
          rbSummary.value = res.pitch;
          if (typeof onResumeFormInput === 'function') onResumeFormInput();
        }
      }
    } catch (e) {
      console.error(e);
    }
  },

  async savePersonality() {
    const profile = window.AppState.activeProfile;
    if (!profile) return;

    const pitch = document.getElementById('personalityElevatorPitch')?.value || '';

    try {
      const res = await apiRequest('/api/profile/personality', {
        method: 'POST',
        body: JSON.stringify({
          studentId: profile.id,
          archetype: this.activeArchetype,
          traits: this.traits,
          elevatorPitch: pitch
        })
      });

      if (res.success) {
        window.AppState.activeProfile.personality = res.personality;
        showToast('Career personality profile saved successfully!');
        if (window.SweetTape) window.SweetTape.playTapeSound('stick');
      }
    } catch (e) {
      console.error(e);
    }
  }
};

window.PersonalityStudio = PersonalityStudio;
