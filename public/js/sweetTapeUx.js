// ==========================================================================
// SWEET-TAPE.COM INTERACTIVE UX SYSTEM
// Real-time tactile tape audio synthesis, "ROLL IT!" tape track,
// peelable tape strips, and "PULL ME" drawer.
// Aesthetic: Vibrant Cyan & Deep Ocean Blues with tactile physical metaphors
// ==========================================================================

const SweetTape = {
  soundEnabled: true,
  audioCtx: null,

  // Initialize Web Audio Context on first user gesture
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  },

  // Synthesize realistic tape sound effects (zero external audio files needed)
  playTapeSound(type = 'peel') {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'peel') {
        // Tape peel / unroll: filtered noise with frequency sweep
        const bufferSize = ctx.sampleRate * 0.18;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.15);
        filter.Q.setValueAtTime(3, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.17);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'stick') {
        // Tape stick / press: short tactile low snap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'snip') {
        // Tape cutter snip: crisp click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'roll') {
        // Roll spin: subtle mechanical swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.22);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      console.warn('Audio synthesis notice:', e.message);
    }
  },

  // Toggle sound on/off
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('sweetTapeSoundBtn');
    if (btn) {
      btn.classList.toggle('muted', !this.soundEnabled);
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = this.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      }
    }
    if (this.soundEnabled) {
      this.playTapeSound('peel');
      showToast('SweetTape tactile audio enabled!');
    } else {
      showToast('SweetTape tactile audio muted.');
    }
  },

  // Switch views via SweetTape "ROLL IT!" roll pucks
  onRollSelect(viewId, rollElement) {
    this.playTapeSound('roll');
    setTimeout(() => this.playTapeSound('peel'), 60);

    // Update active roll styling
    const allRolls = document.querySelectorAll('.sweet-roll-puck');
    allRolls.forEach(r => r.classList.remove('active'));
    if (rollElement) rollElement.classList.add('active');

    // Trigger sweet sweep transition
    const sweep = document.getElementById('sweetSweepOverlay');
    if (sweep) {
      sweep.classList.remove('animating');
      void sweep.offsetWidth; // trigger reflow
      sweep.classList.add('animating');
    }

    // Call standard app navigation
    if (typeof switchView === 'function') {
      switchView(viewId);
    }
  },

  // Toggle "PULL ME" Side Drawer
  togglePullMeDrawer(forceClose = false) {
    const drawer = document.getElementById('sweetPullMeDrawer');
    const tab = document.getElementById('sweetPullMeTab');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open') && !forceClose;
    if (isOpen) {
      drawer.classList.remove('open');
      if (tab) tab.classList.remove('pulled');
      this.playTapeSound('stick');
    } else {
      drawer.classList.add('open');
      if (tab) tab.classList.add('pulled');
      this.playTapeSound('peel');
      this.populateDrawerContents();
    }
  },

  // Populate quick glance data in the drawer
  populateDrawerContents() {
    const profile = window.AppState.activeProfile;
    const readiness = window.AppState.readiness;
    const scoreVal = readiness?.totalScore || 84;

    const scoreEl = document.getElementById('drawerScoreVal');
    const nameEl = document.getElementById('drawerCandidateName');
    const roleEl = document.getElementById('drawerCandidateRole');
    const statusEl = document.getElementById('drawerPlacementStatus');

    if (scoreEl) scoreEl.textContent = `${scoreVal}/100`;
    if (nameEl) nameEl.textContent = profile?.name || 'Candidate';
    if (roleEl) roleEl.textContent = profile?.targetRole || 'Software Developer';
    if (statusEl) {
      statusEl.textContent = scoreVal >= 75 ? 'Placement Ready (Tier 1)' : (scoreVal >= 55 ? 'Almost Ready' : 'Needs Practice');
      statusEl.className = scoreVal >= 75 ? 'tape-tag verified' : 'tape-tag hot';
    }
  },

  // Attach tactile sound & peel triggers to all buttons and cards
  attachTactileListeners() {
    // Sound on all buttons
    document.querySelectorAll('.btn, .nav-item, .tape-tag, .interest-card, .prompt-chip').forEach(el => {
      if (!el.hasAttribute('data-tape-listener')) {
        el.setAttribute('data-tape-listener', 'true');
        el.addEventListener('click', () => {
          SweetTape.playTapeSound('stick');
        });
      }
    });

    // Sound on tab clicks
    document.querySelectorAll('.review-tab-btn, .auth-tab-btn').forEach(tab => {
      if (!tab.hasAttribute('data-tape-tab-listener')) {
        tab.setAttribute('data-tape-tab-listener', 'true');
        tab.addEventListener('click', () => {
          SweetTape.playTapeSound('peel');
        });
      }
    });
  }
};

// Bootstrap SweetTape interactions
window.addEventListener('DOMContentLoaded', () => {
  SweetTape.attachTactileListeners();

  // Re-attach listeners whenever views change
  const origSwitchView = window.switchView;
  if (typeof origSwitchView === 'function') {
    window.switchView = function(viewId) {
      origSwitchView(viewId);
      setTimeout(() => SweetTape.attachTactileListeners(), 100);

      // Also update active roll puck if present
      const rollPuck = document.querySelector(`.sweet-roll-puck[data-target-view="${viewId}"]`);
      if (rollPuck) {
        document.querySelectorAll('.sweet-roll-puck').forEach(r => r.classList.remove('active'));
        rollPuck.classList.add('active');
      }
    };
  }
});
