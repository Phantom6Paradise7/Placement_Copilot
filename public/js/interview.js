// Module 3: AI Placement Mock Interview Room
let speechRecognitionInstance = null;
let isRecordingVoice = false;

// Initialize Web Speech Recognition if available
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.continuous = false;
  speechRecognitionInstance.interimResults = false;
  speechRecognitionInstance.lang = 'en-US';

  speechRecognitionInstance.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('interviewAnswerInput');
    if (input) {
      input.value = input.value ? `${input.value} ${transcript}` : transcript;
    }
  };

  speechRecognitionInstance.onend = () => {
    isRecordingVoice = false;
    const btn = document.getElementById('voiceMicBtn');
    if (btn) btn.classList.remove('recording');
    toggleVisualizer(false);
  };

  speechRecognitionInstance.onerror = (e) => {
    console.warn('Speech recognition warning:', e.error);
    isRecordingVoice = false;
    const btn = document.getElementById('voiceMicBtn');
    if (btn) btn.classList.remove('recording');
    toggleVisualizer(false);
  };
}

function toggleVoiceSpeechInput() {
  if (!speechRecognitionInstance) {
    showToast('Web Speech recognition not supported in this browser. Please type your answer.', 'error');
    return;
  }

  const btn = document.getElementById('voiceMicBtn');
  if (isRecordingVoice) {
    speechRecognitionInstance.stop();
    isRecordingVoice = false;
    if (btn) btn.classList.remove('recording');
    toggleVisualizer(false);
  } else {
    speechRecognitionInstance.start();
    isRecordingVoice = true;
    if (btn) btn.classList.add('recording');
    toggleVisualizer(true);
    showToast('Listening... Speak your technical explanation.');
  }
}

let currentElevenLabsAudio = null;

function stripMarkdownForSpeechClient(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' Technical implementation details provided in code block. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^###\s*[^\n]*/gm, match => match.replace(/^###\s*/, '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim() + '. ')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-*_]{3,}\s*$/gm, ' ')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function speakWithElevenLabs(rawText, onStart, onEnd) {
  // If already playing audio, stop it (toggle off)
  if (currentElevenLabsAudio) {
    currentElevenLabsAudio.pause();
    currentElevenLabsAudio = null;
    toggleVisualizer(false);
    if (onEnd) onEnd();
    return;
  }

  // Also stop any running browser speech synthesis
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    toggleVisualizer(false);
    if (onEnd) onEnd();
    return;
  }

  const cleanText = stripMarkdownForSpeechClient(rawText);
  if (!cleanText) return;

  try {
    const res = await fetch('/api/tts/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    currentElevenLabsAudio = audio;

    audio.onplay = () => {
      toggleVisualizer(true);
      if (onStart) onStart();
    };

    audio.onended = () => {
      toggleVisualizer(false);
      URL.revokeObjectURL(audioUrl);
      currentElevenLabsAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      toggleVisualizer(false);
      URL.revokeObjectURL(audioUrl);
      currentElevenLabsAudio = null;
      if (onEnd) onEnd();
      fallbackSpeechSynthesis(cleanText, onStart, onEnd);
    };

    await audio.play();
  } catch (err) {
    console.info('ElevenLabs TTS fallback to speech synthesis:', err.message);
    fallbackSpeechSynthesis(cleanText, onStart, onEnd);
  }
}

function fallbackSpeechSynthesis(cleanText, onStart, onEnd) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  toggleVisualizer(true);
  if (onStart) onStart();

  utterance.onend = () => {
    toggleVisualizer(false);
    if (onEnd) onEnd();
  };
  utterance.onerror = () => {
    toggleVisualizer(false);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

function speakQuestion(text) {
  const autoTts = document.getElementById('autoTtsCheckbox')?.checked !== false;
  if (!autoTts) return;
  speakWithElevenLabs(text);
}

function toggleVisualizer(active) {
  const v = document.getElementById('voiceVisualizer');
  if (!v) return;
  if (active) v.classList.add('active');
  else v.classList.remove('active');
}

// Start Interview Session
async function startMockInterview() {
  const profile = window.AppState.activeProfile;
  if (!profile) return;

  const durationSelect = document.getElementById('interviewDurationSelect');
  const duration = parseInt(durationSelect?.value || '15', 10);

  // Reset chat container
  const container = document.getElementById('interviewChatContainer');
  if (container) container.innerHTML = '';

  // Initialize timer
  window.AppState.interviewSecondsRemaining = duration * 60;
  startInterviewTimer();

  try {
    const res = await apiRequest('/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({
        studentId: profile.id,
        durationMinutes: duration,
        targetRole: profile.targetRole
      })
    });

    window.AppState.interviewSession = {
      id: res.sessionId,
      turn: 1,
      durationMinutes: duration
    };

    const roleTitle = document.getElementById('interviewRoleTitle');
    if (roleTitle) roleTitle.textContent = `Technical Interview: ${profile.targetRole || 'Software Engineer'}`;

    appendInterviewMessage('ai', res.question, '00:00');
    speakQuestion(res.question);
    updateTurnIndicator(1);
  } catch (err) {
    console.error('Failed to start interview:', err);
  }
}

function startInterviewTimer() {
  if (window.AppState.interviewTimerInterval) {
    clearInterval(window.AppState.interviewTimerInterval);
  }

  const timerEl = document.getElementById('interviewTimer');

  window.AppState.interviewTimerInterval = setInterval(() => {
    if (window.AppState.interviewSecondsRemaining <= 0) {
      clearInterval(window.AppState.interviewTimerInterval);
      showToast('Interview session time reached! Wrapping up evaluation.');
      endInterviewEarly();
      return;
    }

    window.AppState.interviewSecondsRemaining--;
    const mins = Math.floor(window.AppState.interviewSecondsRemaining / 60);
    const secs = window.AppState.interviewSecondsRemaining % 60;
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function updateTurnIndicator(turn) {
  const el = document.getElementById('interviewTurnIndicator');
  if (el) el.textContent = `Turn ${turn} / 5`;
}

// Markdown Formatter for Claude / GPT responses
function formatClaudeMarkdown(text) {
  if (!text) return '';
  let str = text;

  // Code blocks: ```js ... ```
  str = str.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; color: var(--cyan-light); font-weight: 700; text-transform: uppercase;"><span>${lang || 'code'}</span><span style="cursor: pointer;" onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText); showToast('Code copied to clipboard!');"><i class="fa-solid fa-copy"></i> Copy</span></div><code>${escapedCode}</code></pre>`;
  });

  // Inline code: `code`
  str = str.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 12px; color: var(--cyan-light);">$1</code>');

  // Bold: **text**
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Bullet points and headers
  const lines = str.split('\n');
  let inList = false;
  let formatted = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('### ')) {
      if (inList) { formatted += '</ul>'; inList = false; }
      const headerText = line.substring(4);
      const isAlert = headerText.includes('🚨') || headerText.includes('Flagged');
      formatted += `<h4 style="margin: 10px 0 6px; font-size: 13.5px; font-weight: 800; color: ${isAlert ? '#ef4444' : '#fff'}; display: flex; align-items: center; gap: 6px;">${headerText}</h4>`;
    } else if (line === '---' || line === '***') {
      if (inList) { formatted += '</ul>'; inList = false; }
      formatted += `<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 12px 0;">`;
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        formatted += '<ul style="margin: 6px 0 10px 18px; padding: 0;">';
        inList = true;
      }
      formatted += `<li style="margin-bottom: 4px; line-height: 1.5;">${line.substring(2)}</li>`;
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        formatted += '<ol style="margin: 6px 0 10px 18px; padding: 0;">';
        inList = true;
      }
      formatted += `<li style="margin-bottom: 4px; line-height: 1.5;">${line.replace(/^\d+\.\s/, '')}</li>`;
    } else {
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      if (line.length > 0) {
        if (line.includes('🚨 FLAGGED:')) {
          formatted += `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 8px 12px; margin: 8px 0; color: #fca5a5; font-weight: 600;"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i> ${line}</div>`;
        } else {
          formatted += `<p style="margin: 4px 0 8px; line-height: 1.6;">${line}</p>`;
        }
      }
    }
  }
  if (inList) formatted += '</ul>';

  return formatted || `<p>${text}</p>`;
}

function appendInterviewMessage(sender, text, timeStr) {
  const container = document.getElementById('interviewChatContainer');
  if (!container) return;

  const profile = window.AppState.activeProfile;
  const candidateInitials = profile ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ME';
  const now = new Date();
  const timeDisplay = timeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const div = document.createElement('div');
  div.className = `claude-msg ${sender}`;

  if (sender === 'ai') {
    div.innerHTML = `
      <div class="claude-avatar ai">
        <i class="fa-solid fa-sparkles"></i>
      </div>
      <div class="claude-msg-content">
        <div class="claude-msg-header">
          <div class="claude-speaker-name">
            <span>✦ Placement Copilot AI</span>
            <span class="claude-speaker-tag">Interviewer Bot</span>
          </div>
          <span class="chat-msg-time">${timeDisplay}</span>
        </div>
        <div class="claude-bubble">
          ${formatClaudeMarkdown(text)}
        </div>
        <div class="claude-msg-actions">
          <button class="claude-action-btn" onclick="speakInterviewResponse(decodeURIComponent('${encodeURIComponent(text)}'), this)" title="Listen via Text-to-Speech">
            <i class="fa-solid fa-volume-high"></i> Read Aloud
          </button>
          <button class="claude-action-btn" onclick="copyInterviewResponse(decodeURIComponent('${encodeURIComponent(text)}'), this)" title="Copy message text">
            <i class="fa-solid fa-copy"></i> Copy
          </button>
          <button class="claude-action-btn" onclick="requestAiHint()" title="Ask for a guiding hint">
            <i class="fa-solid fa-lightbulb"></i> Hint
          </button>
        </div>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="claude-avatar user">${candidateInitials}</div>
      <div class="claude-msg-content">
        <div class="claude-msg-header">
          <span class="chat-msg-time">${timeDisplay}</span>
          <div class="claude-speaker-name">
            <span>You (Candidate)</span>
          </div>
        </div>
        <div class="claude-bubble">
          <p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    `;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Auto-grow textarea like Claude / ChatGPT
function autoGrowInput(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function insertPromptSuggestion(text) {
  const input = document.getElementById('interviewAnswerInput');
  if (!input) return;
  input.value = text;
  autoGrowInput(input);
  input.focus();
}

function toggleClaudeThinking(show) {
  const indicator = document.getElementById('interviewThinkingIndicator');
  if (indicator) {
    if (show) indicator.classList.add('active');
    else indicator.classList.remove('active');
  }
}

function copyInterviewResponse(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied answer to clipboard!');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

function speakInterviewResponse(text, btn) {
  const origHtml = btn ? btn.innerHTML : '';
  speakWithElevenLabs(text, () => {
    if (btn) {
      btn.classList.add('speaking');
      btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> Stop Audio`;
    }
  }, () => {
    if (btn) {
      btn.classList.remove('speaking');
      btn.innerHTML = origHtml || `<i class="fa-solid fa-volume-high"></i> Read Aloud`;
    }
  });
}

function requestAiHint() {
  const input = document.getElementById('interviewAnswerInput');
  if (input) {
    input.value = "Could you give me a subtle hint or architectural structure to consider for this problem?";
    autoGrowInput(input);
    submitInterviewTurn();
  }
}

function requestAnswerFeedback() {
  const input = document.getElementById('interviewAnswerInput');
  if (input) {
    input.value = "How did I perform on the previous turn? What edge cases or benchmarks should I emphasize more?";
    autoGrowInput(input);
    submitInterviewTurn();
  }
}

// Handle Student Submitting Answer
async function submitInterviewTurn() {
  const input = document.getElementById('interviewAnswerInput');
  const answer = (input?.value || '').trim();
  if (!answer) {
    showToast('Please speak or type your answer before submitting.', 'error');
    return;
  }

  const session = window.AppState.interviewSession;
  if (!session) {
    showToast('No active interview session found.', 'error');
    return;
  }

  input.value = '';
  input.style.height = 'auto';

  const now = new Date();
  const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  appendInterviewMessage('user', answer, timeFormatted);

  // Show Claude thinking indicator
  toggleClaudeThinking(true);

  try {
    const res = await apiRequest('/api/interview/turn', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: session.id,
        answer,
        timeFormatted
      })
    });

    toggleClaudeThinking(false);

    appendInterviewMessage('ai', res.question, timeFormatted);
    speakQuestion(res.question);

    if (res.isFinished) {
      clearInterval(window.AppState.interviewTimerInterval);
      if (res.session) {
        showScorecardModal(res.session);
      }
      if (res.readiness) {
        window.AppState.readiness = res.readiness;
        renderReadinessScore(res.readiness);
      }
    } else {
      session.turn = res.turn;
      updateTurnIndicator(res.turn);
    }
  } catch (err) {
    toggleClaudeThinking(false);
    console.error(err);
    showToast('Failed to receive AI interviewer response.', 'error');
  }
}

function handleInterviewInputKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submitInterviewTurn();
  }
}

async function endInterviewEarly() {
  const session = window.AppState.interviewSession;
  if (!session) {
    if (window.AppState.interviewTimerInterval) {
      clearInterval(window.AppState.interviewTimerInterval);
    }
    showToast('Interview session concluded.');
    switchView('dashboard-view');
    return;
  }

  const confirmEnd = confirm('Are you sure you want to end the technical mock interview and view your evaluation scorecard?');
  if (!confirmEnd) return;

  if (window.AppState.interviewTimerInterval) {
    clearInterval(window.AppState.interviewTimerInterval);
  }

  showToast('Finalizing viva evaluation and generating scorecard...');

  try {
    const res = await apiRequest('/api/interview/finish', {
      method: 'POST',
      body: JSON.stringify({ sessionId: session.id })
    });

    if (res && res.session) {
      appendInterviewMessage('ai', 'Technical interview session concluded. Here is your comprehensive evaluation breakdown and score.', 'Done');
      showScorecardModal(res.session);

      if (res.readiness) {
        window.AppState.readiness = res.readiness;
        renderReadinessScore(res.readiness);
      }
    } else {
      showToast('Interview session concluded.');
      switchView('dashboard-view');
    }
  } catch (err) {
    console.error('Failed to conclude interview:', err);
    showToast('Interview concluded.', 'info');
    switchView('dashboard-view');
  }
}

// Display Post-Interview Scorecard
function showScorecardModal(session) {
  const body = document.getElementById('scorecardBody');
  if (!body) return;

  const scores = session.scores || { total: 78, conceptual: 3.5, depth: 3.5, problemSolving: 4.0, practical: 4.0, communication: 4.0 };

  let html = `
    <div style="text-align: center; margin-bottom: 20px; background: rgba(2, 35, 2, 0.6); padding: 18px; border-radius: var(--radius-lg); border: 1.5px dashed var(--lime-border);">
      <div style="font-size: 48px; font-weight: 900; color: var(--lime-primary); font-family: var(--font-heading); text-shadow: 0 0 20px var(--lime-glow);">
        ${scores.total} <span style="font-size: 16px; color: var(--text-secondary); font-weight: 600;">/ 100</span>
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px; font-weight: 600;">
        Role: <strong style="color: #fff;">${session.targetRole || 'Software Engineer'}</strong> • Mode: Voice & Interactive AI
      </div>
    </div>

    <!-- 5 Rubric Scores -->
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 20px;">
      <div class="card" style="padding: 10px; text-align: center; background: rgba(2, 43, 2, 0.9); border: 1px solid var(--border-subtle);">
        <span style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Conceptual</span>
        <div style="font-size: 16px; font-weight: 800; color: var(--lime-light); margin-top: 3px;">${scores.conceptual} / 5</div>
      </div>
      <div class="card" style="padding: 10px; text-align: center; background: rgba(2, 43, 2, 0.9); border: 1px solid var(--border-subtle);">
        <span style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Depth</span>
        <div style="font-size: 16px; font-weight: 800; color: var(--lime-light); margin-top: 3px;">${scores.depth} / 5</div>
      </div>
      <div class="card" style="padding: 10px; text-align: center; background: rgba(2, 43, 2, 0.9); border: 1px solid var(--border-subtle);">
        <span style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Problem Solv</span>
        <div style="font-size: 16px; font-weight: 800; color: var(--lime-light); margin-top: 3px;">${scores.problemSolving} / 5</div>
      </div>
      <div class="card" style="padding: 10px; text-align: center; background: rgba(2, 43, 2, 0.9); border: 1px solid var(--border-subtle);">
        <span style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Practical</span>
        <div style="font-size: 16px; font-weight: 800; color: var(--lime-light); margin-top: 3px;">${scores.practical} / 5</div>
      </div>
      <div class="card" style="padding: 10px; text-align: center; background: rgba(2, 43, 2, 0.9); border: 1px solid var(--border-subtle);">
        <span style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Comm</span>
        <div style="font-size: 16px; font-weight: 800; color: var(--lime-light); margin-top: 3px;">${scores.communication} / 5</div>
      </div>
    </div>

    <!-- Strengths & Improvement Areas -->
    <div style="margin-bottom: 14px; background: rgba(2, 43, 2, 0.7); padding: 14px; border-radius: var(--radius-md); border-left: 4px solid var(--lime-primary);">
      <h5 style="font-size: 13px; font-weight: 700; color: var(--lime-light); margin-bottom: 6px;">
        <i class="fa-solid fa-circle-check"></i> Key Strengths Demonstrated:
      </h5>
      <ul style="font-size: 12.5px; color: #cbd5e1; padding-left: 20px; line-height: 1.6;">
        ${(session.strengths || []).map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    <div style="background: rgba(2, 43, 2, 0.7); padding: 14px; border-radius: var(--radius-md); border-left: 4px solid var(--tape-orange);">
      <h5 style="font-size: 13px; font-weight: 700; color: var(--tape-orange); margin-bottom: 6px;">
        <i class="fa-solid fa-lightbulb"></i> Recommended Polish for Campus Drives:
      </h5>
      <ul style="font-size: 12.5px; color: #cbd5e1; padding-left: 20px; line-height: 1.6;">
        ${(session.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
      </ul>
    </div>
  `;

  body.innerHTML = html;
  openModal('scorecardModal');
}

// Past Session Transcripts History Modal
async function openInterviewHistoryModal() {
  const profileId = window.AppState.activeProfile?.id;
  if (!profileId) return;

  try {
    const list = await apiRequest(`/api/interviews/${profileId}`);
    if (list.length === 0) {
      showToast('No completed interview sessions yet for this profile.');
      return;
    }
    const latest = list[list.length - 1];
    showScorecardModal(latest);
  } catch (e) {
    console.error(e);
  }
}
