// InterviewAI Browser Extension - Background Service Worker
// Handles messaging between popup, content scripts, and storage

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.local.get(['apiBaseUrl', 'apiKey', 'model'], (data) => {
    if (!data.apiBaseUrl) {
      chrome.storage.local.set({
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4',
        context: ''
      });
    }
  });
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['apiBaseUrl', 'apiKey', 'model', 'context'], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  if (message.type === 'GENERATE_RESPONSE') {
    handleGeneration(message.question, message.settings)
      .then(response => sendResponse({ success: true, response }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function handleGeneration(question, settings) {
  const baseUrl = settings?.apiBaseUrl || 'https://api.openai.com/v1';
  const apiKey = settings?.apiKey;
  const model = settings?.model || 'gpt-4';
  const context = settings?.context || '';

  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const systemPrompt = `You are an expert interview coach. Help answer interview questions professionally and concisely.${context ? `\n\nCandidate context:\n${context}` : ''}`;

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
  return result.choices?.[0]?.message?.content || 'No response generated.';
}
