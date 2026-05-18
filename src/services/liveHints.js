// Live Hints Service - Streaming hint engine for real-time interview suggestions
// Detects when interviewer finishes speaking and generates concise talking points
// Supports two modes: 'practice' (detailed) and 'live' (minimal keywords)

export class LiveHintsService {
  constructor({ llmService, settings, onHints, onHintsExpired }) {
    this.llmService = llmService;
    this.settings = settings;
    this.onHints = onHints;
    this.onHintsExpired = onHintsExpired;
    this.currentHints = null;
    this.fadeTimer = null;
    this.abortController = null;
    this.queue = [];
    this.isGenerating = false;
  }

  updateSettings(settings) {
    this.settings = settings;
  }

  updateLLMService(llmService) {
    this.llmService = llmService;
  }

  // Get hint settings with defaults
  getHintSettings() {
    return {
      mode: this.settings.liveHintsMode || 'practice',
      displayDuration: this.settings.liveHintsDisplayDuration || 30,
      maxHints: this.settings.liveHintsMaxHints || 4,
      opacity: this.settings.liveHintsOpacity || 0.4,
      position: this.settings.liveHintsPosition || 'bottom-right'
    };
  }

  // Build system prompt for hints generation
  buildHintsPrompt(question) {
    const { mode, maxHints } = this.getHintSettings();

    if (mode === 'live') {
      return `You are a real-time interview hint generator. Given the interviewer's question, generate exactly ${maxHints} ultra-concise keyword hints (3-4 words MAX per hint). No full sentences. No explanations. Just keywords/phrases the candidate can glance at.

FORMAT: Return ONLY a JSON array of strings. Example: ["leadership example", "metrics driven", "team conflict resolved", "promoted after"]

RULES:
- Each hint is 3-4 words MAXIMUM
- No articles (a, the, an)
- No filler words
- Just core keywords that trigger memory
- Make hints relevant to the candidate's resume and job description
${this.settings.resume ? `\nCANDIDATE RESUME:\n${this.settings.resume.slice(0, 1500)}` : ''}
${this.settings.jobDescription ? `\nJOB DESCRIPTION:\n${this.settings.jobDescription.slice(0, 1000)}` : ''}`;
    }

    // Practice mode - more detailed hints
    return `You are a real-time interview coach. Given the interviewer's question, generate exactly ${maxHints} concise talking point hints. These should be bullet-point reminders, not full answers.

FORMAT: Return ONLY a JSON array of strings. Example: ["Use STAR: describe the team conflict at Company X", "Mention the 30% improvement metric", "Highlight leadership initiative", "End with lesson learned"]

RULES:
- Each hint is 1 short sentence or phrase (max 10-12 words)
- Include STAR method prompts for behavioral questions
- Reference specific resume details when relevant
- Include metrics/numbers the candidate should mention
- Suggest concrete examples from their experience
${this.settings.resume ? `\nCANDIDATE RESUME:\n${this.settings.resume.slice(0, 2000)}` : ''}
${this.settings.jobDescription ? `\nJOB DESCRIPTION:\n${this.settings.jobDescription.slice(0, 1500)}` : ''}
${this.settings.companyInfo ? `\nCOMPANY INFO:\n${this.settings.companyInfo.slice(0, 500)}` : ''}`;
  }

  // Generate hints for a detected question
  async generateHints(question) {
    if (!this.llmService || !question.trim()) return;

    // If already generating, queue this question (replace old queue)
    if (this.isGenerating) {
      this.queue = [question];
      return;
    }

    this.isGenerating = true;

    // Cancel any existing fade timer
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    // Abort previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const { displayDuration, maxHints } = this.getHintSettings();
    const systemPrompt = this.buildHintsPrompt(question);

    try {
      const response = await fetch(`${this.llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.llmService.apiKey ? { 'Authorization': `Bearer ${this.llmService.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: this.llmService.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Interviewer asked: "${question}"\n\nGenerate ${maxHints} hint keywords/phrases as a JSON array:` }
          ],
          temperature: 0.6,
          max_tokens: 300
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        console.error('Live hints API error:', response.status);
        this.isGenerating = false;
        this.processQueue();
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON array from response
      const hints = this.parseHints(content, maxHints);

      if (hints.length > 0) {
        this.currentHints = {
          question,
          hints,
          timestamp: Date.now()
        };

        // Notify callback
        if (this.onHints) {
          this.onHints(this.currentHints);
        }

        // Set auto-fade timer
        this.fadeTimer = setTimeout(() => {
          this.currentHints = null;
          if (this.onHintsExpired) {
            this.onHintsExpired();
          }
        }, displayDuration * 1000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Live hints generation failed:', err);
      }
    }

    this.isGenerating = false;
    this.processQueue();
  }

  // Process queued questions
  processQueue() {
    if (this.queue.length > 0) {
      const nextQuestion = this.queue.pop();
      this.queue = [];
      this.generateHints(nextQuestion);
    }
  }

  // Parse hints from LLM response
  parseHints(content, maxHints) {
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, maxHints).map(h => String(h).trim()).filter(h => h.length > 0);
        }
      }
    } catch (e) {
      // Fallback: try to parse line by line
    }

    // Fallback: split by newlines and clean up
    const lines = content
      .split('\n')
      .map(l => l.replace(/^[-•*\d.)\]]+\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter(l => l.length > 0 && l.length < 100);

    return lines.slice(0, maxHints);
  }

  // Dismiss current hints
  dismiss() {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.currentHints = null;
    if (this.onHintsExpired) {
      this.onHintsExpired();
    }
  }

  // Stop and cleanup
  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.currentHints = null;
    this.queue = [];
    this.isGenerating = false;
  }
}
