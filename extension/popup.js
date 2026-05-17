// InterviewAI Browser Extension - Popup Script
// Handles STT via Web Speech API and LLM calls

let isListening = false;
let recognition = null;
let questionBuffer = '';
let silenceTimer = null;
let settingsVisible = false;

// DOM elements
const toggleBtn = document.getElementById('toggleBtn');
const settingsBtn = document.getElementById('settingsBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const transcriptEl = document.getElementById('transcript');
const responseEl = document.getElementById('response');
const statusDot = document.getElementById('statusDot');
const settingsSection = document.getElementById('settingsSection');
const saveSettingsBtn = document.getElementById('saveSettings');

// Load settings
async function loadSettings() {
  const data = await chrome.storage.local.get(['apiBaseUrl', 'apiKey', 'model', 'context']);
  document.getElementById('apiBaseUrl').value = data.apiBaseUrl || 'https://api.openai.com/v1';
  document.getElementById('apiKey').value = data.apiKey || '';
  document.getElementById('model').value = data.model || 'gpt-4';
  document.getElementById('context').value = data.context || '';
}

// Save settings
saveSettingsBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({
    apiBaseUrl: document.getElementById('apiBaseUrl').value,
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('model').value,
    context: document.getElementById('context').value
  });
  settingsSection.style.display = 'none';
  settingsVisible = false;
});

// Toggle settings
settingsBtn.addEventListener('click', () => {
  settingsVisible = !settingsVisible;
  settingsSection.style.display = settingsVisible ? 'block' : 'none';
});

// Clear
clearBtn.addEventListener('click', () => {
  questionBuffer = '';
  transcriptEl.innerHTML = '<span class="placeholder">Waiting for speech...</span>';
  responseEl.innerHTML = '<span class="placeholder">Response will appear here...</span>';
  copyBtn.style.display = 'none';
});

// Copy response
copyBtn.addEventListener('click', () => {
  const text = responseEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '✅ Copied!';
    setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
  });
});

// Toggle listening
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
    responseEl.innerHTML = '<span class="error">Speech recognition not supported in this browser.</span>';
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
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    if (final) {
      questionBuffer += ' ' + final;
      transcriptEl.textContent = questionBuffer.trim();

      // Reset silence timer
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
    console.error('Speech error:', event.error);
    if (event.error === 'not-allowed') {
      responseEl.innerHTML = '<span class="error">Microphone access denied.</span>';
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
  toggleBtn.classList.add('active');
  statusDot.classList.add('active');
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
  toggleBtn.textContent = 'Start Listening';
  toggleBtn.classList.remove('active');
  statusDot.classList.remove('active');
}

async function generateResponse(question) {
  if (!question.trim()) return;

  const data = await chrome.storage.local.get(['apiBaseUrl', 'apiKey', 'model', 'context']);
  const baseUrl = data.apiBaseUrl || 'https://api.openai.com/v1';
  const apiKey = data.apiKey;
  const model = data.model || 'gpt-4';
  const context = data.context || '';

  if (!apiKey) {
    responseEl.innerHTML = '<span class="error">Set your API key in settings.</span>';
    return;
  }

  responseEl.innerHTML = '<span class="generating">Generating...</span>';

  try {
    const systemPrompt = `You are an expert interview coach. Help the user answer interview questions professionally and concisely.${context ? `\n\nContext about the candidate:\n${context}` : ''}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Interview question: "${question}"\n\nProvide a concise, professional answer.` }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || 'No response generated.';
    responseEl.textContent = text;
    copyBtn.style.display = 'block';
  } catch (err) {
    responseEl.innerHTML = `<span class="error">Error: ${err.message}</span>`;
  }
}

// Initialize
loadSettings();
settingsSection.style.display = 'none';
