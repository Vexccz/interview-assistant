// InterviewAI Browser Extension - Content Script
// Injects floating widget on Google Meet/Zoom web pages

(function() {
  'use strict';

  // Avoid double injection
  if (document.getElementById('interviewai-widget')) return;

  let isListening = false;
  let recognition = null;
  let questionBuffer = '';
  let silenceTimer = null;
  let isMinimized = false;

  // Create floating widget
  const widget = document.createElement('div');
  widget.id = 'interviewai-widget';
  widget.innerHTML = `
    <div class="iai-header">
      <span class="iai-title">InterviewAI</span>
      <div class="iai-header-controls">
        <button class="iai-btn-mini" id="iai-minimize" title="Minimize">−</button>
        <button class="iai-btn-mini" id="iai-close" title="Close">×</button>
      </div>
    </div>
    <div class="iai-body" id="iai-body">
      <div class="iai-controls">
        <button id="iai-toggle" class="iai-btn">Start</button>
        <span class="iai-status" id="iai-status"></span>
      </div>
      <div class="iai-section">
        <div class="iai-label">Interviewer</div>
        <div class="iai-transcript" id="iai-transcript">Waiting...</div>
      </div>
      <div class="iai-section">
        <div class="iai-label">Suggested Response</div>
        <div class="iai-response" id="iai-response">—</div>
        <button class="iai-btn-copy" id="iai-copy" style="display:none;">Copy</button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // Make widget draggable
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const header = widget.querySelector('.iai-header');
  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    dragOffsetX = e.clientX - widget.offsetLeft;
    dragOffsetY = e.clientY - widget.offsetTop;
    widget.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    widget.style.left = (e.clientX - dragOffsetX) + 'px';
    widget.style.top = (e.clientY - dragOffsetY) + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    widget.style.transition = '';
  });

  // Controls
  const toggleBtn = document.getElementById('iai-toggle');
  const minimizeBtn = document.getElementById('iai-minimize');
  const closeBtn = document.getElementById('iai-close');
  const copyBtn = document.getElementById('iai-copy');
  const transcriptEl = document.getElementById('iai-transcript');
  const responseEl = document.getElementById('iai-response');
  const statusEl = document.getElementById('iai-status');
  const bodyEl = document.getElementById('iai-body');

  minimizeBtn.addEventListener('click', () => {
    isMinimized = !isMinimized;
    bodyEl.style.display = isMinimized ? 'none' : 'block';
    minimizeBtn.textContent = isMinimized ? '+' : '−';
    widget.classList.toggle('iai-minimized', isMinimized);
  });

  closeBtn.addEventListener('click', () => {
    stopListening();
    widget.remove();
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(responseEl.textContent).then(() => {
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });
  });

  toggleBtn.addEventListener('click', () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      statusEl.textContent = 'Not supported';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }

      if (final) {
        questionBuffer += ' ' + final;
        transcriptEl.textContent = questionBuffer.trim();

        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          generateResponse(questionBuffer.trim());
          questionBuffer = '';
        }, 2000);
      }

      if (interim) {
        transcriptEl.textContent = (questionBuffer + ' ' + interim).trim();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        statusEl.textContent = 'Mic denied';
        stopListening();
      }
    };

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => {
          if (isListening) {
            try { recognition.start(); } catch (e) {}
          }
        }, 100);
      }
    };

    recognition.start();
    isListening = true;
    toggleBtn.textContent = 'Stop';
    toggleBtn.classList.add('iai-active');
    statusEl.textContent = '● Recording';
    statusEl.classList.add('iai-recording');
  }

  function stopListening() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    isListening = false;
    toggleBtn.textContent = 'Start';
    toggleBtn.classList.remove('iai-active');
    statusEl.textContent = '';
    statusEl.classList.remove('iai-recording');
  }

  async function generateResponse(question) {
    if (!question.trim()) return;

    const data = await chrome.storage.local.get(['apiBaseUrl', 'apiKey', 'model', 'context']);
    const baseUrl = data.apiBaseUrl || 'https://api.openai.com/v1';
    const apiKey = data.apiKey;
    const model = data.model || 'gpt-4';
    const context = data.context || '';

    if (!apiKey) {
      responseEl.textContent = 'Set API key in extension popup.';
      return;
    }

    responseEl.textContent = 'Thinking...';
    responseEl.classList.add('iai-generating');

    try {
      const systemPrompt = `You are an expert interview coach. Provide concise, professional answers.${context ? `\n\nCandidate context:\n${context}` : ''}`;

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Question: "${question}"\n\nProvide a concise answer (max 3-4 sentences).` }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!resp.ok) throw new Error(`API ${resp.status}`);

      const result = await resp.json();
      const text = result.choices?.[0]?.message?.content || 'No response.';
      responseEl.textContent = text;
      responseEl.classList.remove('iai-generating');
      copyBtn.style.display = 'block';
    } catch (err) {
      responseEl.textContent = `Error: ${err.message}`;
      responseEl.classList.remove('iai-generating');
    }
  }
})();
