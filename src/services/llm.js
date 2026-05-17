// LLM API service - OpenAI-compatible endpoint
// Supports: OpenAI, DeepSeek, Ollama, any OpenAI-compatible API
// Features: question type detection, STAR formatting, concise/detailed modes, follow-up detection, confidence scoring

const QUESTION_TYPES = {
  behavioral: {
    keywords: ['tell me about a time', 'describe a situation', 'give me an example', 'have you ever', 'how did you handle', 'what would you do if', 'share an experience', 'walk me through'],
    label: '🎯 Behavioral',
    promptAddition: 'Use the STAR method (Situation, Task, Action, Result) to structure the response. Label each section clearly.'
  },
  technical: {
    keywords: ['how does', 'what is', 'explain', 'implement', 'difference between', 'algorithm', 'data structure', 'code', 'system design', 'architecture', 'database', 'api', 'framework'],
    label: '💻 Technical',
    promptAddition: 'Give a clear, structured technical explanation. Include specific technologies, patterns, or code concepts where relevant.'
  },
  situational: {
    keywords: ['what would you do', 'how would you', 'imagine', 'suppose', 'if you were', 'hypothetically'],
    label: '🔮 Situational',
    promptAddition: 'Provide a thoughtful approach showing problem-solving skills. Structure as: approach, reasoning, expected outcome.'
  },
  general: {
    keywords: [],
    label: '💬 General',
    promptAddition: 'Give a natural, conversational response that showcases personality and fit.'
  }
};

const FOLLOW_UP_PATTERNS = [
  'elaborate', 'tell me more', 'can you explain', 'what do you mean',
  'go deeper', 'more detail', 'expand on', 'clarify', 'specifically',
  'for example', 'give me an example', 'how exactly', 'why'
];

export class LLMService {
  constructor({ apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4' }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.abortController = null;
    this.lastQuestion = '';
    this.lastResponse = '';
  }

  updateConfig({ apiKey, baseUrl, model }) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (baseUrl !== undefined) this.baseUrl = baseUrl.replace(/\/$/, '');
    if (model !== undefined) this.model = model;
  }

  // Detect question type
  detectQuestionType(question) {
    const lower = question.toLowerCase();

    for (const [type, config] of Object.entries(QUESTION_TYPES)) {
      if (type === 'general') continue;
      for (const keyword of config.keywords) {
        if (lower.includes(keyword)) {
          return { type, ...config };
        }
      }
    }

    return { type: 'general', ...QUESTION_TYPES.general };
  }

  // Detect if this is a follow-up question
  isFollowUp(question) {
    const lower = question.toLowerCase().trim();
    // Short questions that reference previous context
    if (lower.split(' ').length <= 8) {
      for (const pattern of FOLLOW_UP_PATTERNS) {
        if (lower.includes(pattern)) return true;
      }
    }
    return false;
  }

  // Calculate confidence score based on context match
  calculateConfidence(question, context) {
    let score = 0;
    let factors = 0;
    const lower = question.toLowerCase();

    // Check if resume has relevant keywords
    if (context.resume) {
      const resumeWords = context.resume.toLowerCase().split(/\s+/);
      const questionWords = lower.split(/\s+/).filter(w => w.length > 3);
      const matches = questionWords.filter(w => resumeWords.includes(w));
      const resumeRelevance = questionWords.length > 0 ? matches.length / questionWords.length : 0;
      score += resumeRelevance;
      factors++;
    }

    // Check if job description provides context
    if (context.jobDescription) {
      const jdWords = context.jobDescription.toLowerCase().split(/\s+/);
      const questionWords = lower.split(/\s+/).filter(w => w.length > 3);
      const matches = questionWords.filter(w => jdWords.includes(w));
      const jdRelevance = questionWords.length > 0 ? matches.length / questionWords.length : 0;
      score += jdRelevance;
      factors++;
    }

    // Conversation history helps with follow-ups
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      score += 0.3;
      factors++;
    }

    // Base confidence from having any context at all
    if (context.resume || context.jobDescription) {
      score += 0.4;
      factors++;
    }

    const avg = factors > 0 ? score / factors : 0.2;

    if (avg >= 0.5) return { level: 'high', label: '🟢 High', score: avg };
    if (avg >= 0.3) return { level: 'medium', label: '🟡 Medium', score: avg };
    return { level: 'low', label: '🔴 Low', score: avg };
  }

  buildSystemPrompt({ resume, jobDescription, companyInfo, conversationHistory, questionType, isFollowUp, responseMode = 'detailed', useStar = false, bulletMode = false, language = 'en' }) {
    let systemPrompt = `You are an expert interview coach helping a candidate during a live interview. 
Your job is to generate natural-sounding responses that the candidate can use.

RULES:
- Sound natural and conversational, not robotic
- Use first person (as if the candidate is speaking)
- Be specific and give concrete examples when possible
- Don't be generic - tailor to the context provided
- If the question is unclear, provide the most likely intended answer
`;

    // Language instruction
    if (language === 'bm') {
      systemPrompt += `- Respond in Bahasa Malaysia (formal but natural)\n`;
    } else {
      systemPrompt += `- Respond in English\n`;
    }

    // Response mode
    if (responseMode === 'concise') {
      systemPrompt += `- Keep responses very concise: 2-3 sentences maximum\n- Get straight to the point\n`;
    } else {
      systemPrompt += `- Provide detailed, well-structured responses (4-8 sentences)\n`;
    }

    // Bullet point mode
    if (bulletMode) {
      systemPrompt += `- Format the response as bullet points (use • for each point)\n`;
    }

    // STAR method for behavioral
    if (useStar && questionType?.type === 'behavioral') {
      systemPrompt += `\n- Use STAR method and label each section:\n  **Situation:** [context]\n  **Task:** [what needed to be done]\n  **Action:** [what you did]\n  **Result:** [outcome]\n`;
    }

    // Question type specific prompt
    if (questionType && questionType.promptAddition) {
      systemPrompt += `\nQUESTION TYPE: ${questionType.label}\n${questionType.promptAddition}\n`;
    }

    // Follow-up context
    if (isFollowUp && this.lastQuestion && this.lastResponse) {
      systemPrompt += `\nThis is a FOLLOW-UP question. The previous question was: "${this.lastQuestion}"\nYour previous response was: "${this.lastResponse}"\nExpand on or clarify the previous answer.\n`;
    }

    if (resume) {
      systemPrompt += `\n\nCANDIDATE'S RESUME:\n${resume}\n`;
    }
    if (jobDescription) {
      systemPrompt += `\n\nJOB DESCRIPTION:\n${jobDescription}\n`;
    }
    if (companyInfo) {
      systemPrompt += `\n\nCOMPANY INFO:\n${companyInfo}\n`;
    }
    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-5); // Last 5 exchanges
      systemPrompt += `\n\nRECENT CONVERSATION:\n`;
      recent.forEach((entry) => {
        systemPrompt += `Interviewer: ${entry.question}\n`;
        if (entry.response) {
          systemPrompt += `Candidate: ${entry.response}\n`;
        }
      });
    }

    return systemPrompt;
  }

  async generateResponse({ question, context, onChunk, onDone, responseMode = 'detailed', useStar = false, bulletMode = false, language = 'en' }) {
    // Abort any previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    // Detect question type and follow-up
    const questionType = this.detectQuestionType(question);
    const isFollowUp = this.isFollowUp(question);
    const confidence = this.calculateConfidence(question, context);

    const systemPrompt = this.buildSystemPrompt({
      ...context,
      questionType,
      isFollowUp,
      responseMode,
      useStar,
      bulletMode,
      language
    });

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `The interviewer just asked: "${question}"\n\nGenerate a natural response for the candidate to say:` }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: responseMode === 'concise' ? 200 : 800
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify(body),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error (${response.status}): ${error}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            this.lastQuestion = question;
            this.lastResponse = fullResponse;
            if (onDone) onDone(fullResponse, { questionType, confidence, isFollowUp });
            return { response: fullResponse, questionType, confidence, isFollowUp };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              if (onChunk) onChunk(content, fullResponse);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      this.lastQuestion = question;
      this.lastResponse = fullResponse;
      if (onDone) onDone(fullResponse, { questionType, confidence, isFollowUp });
      return { response: fullResponse, questionType, confidence, isFollowUp };
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  // Check if Ollama is running
  async checkOllama(baseUrl = 'http://localhost:11434') {
    try {
      const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        const data = await response.json();
        return { available: true, models: data.models || [] };
      }
      return { available: false, models: [] };
    } catch {
      return { available: false, models: [] };
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
