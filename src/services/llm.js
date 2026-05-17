// LLM API service - OpenAI-compatible endpoint
// Supports: OpenAI, DeepSeek, Ollama, any OpenAI-compatible API

export class LLMService {
  constructor({ apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4' }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.abortController = null;
  }

  updateConfig({ apiKey, baseUrl, model }) {
    if (apiKey !== undefined) this.apiKey = apiKey;
    if (baseUrl !== undefined) this.baseUrl = baseUrl.replace(/\/$/, '');
    if (model !== undefined) this.model = model;
  }

  buildSystemPrompt({ resume, jobDescription, companyInfo, conversationHistory }) {
    let systemPrompt = `You are an expert interview coach helping a candidate during a live interview. 
Your job is to generate concise, natural-sounding responses that the candidate can use.

RULES:
- Keep responses concise (2-4 sentences for simple questions, up to a short paragraph for complex ones)
- Sound natural and conversational, not robotic
- Use first person (as if the candidate is speaking)
- Be specific and give concrete examples when possible
- Don't be generic - tailor to the context provided
- If the question is unclear, provide the most likely intended answer
`;

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
      systemPrompt += `\n\nCONVERSATION SO FAR:\n`;
      conversationHistory.forEach((entry, i) => {
        systemPrompt += `Interviewer: ${entry.question}\n`;
        if (entry.response) {
          systemPrompt += `Candidate: ${entry.response}\n`;
        }
      });
    }

    return systemPrompt;
  }

  async generateResponse({ question, context, onChunk, onDone }) {
    // Abort any previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const systemPrompt = this.buildSystemPrompt(context);

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `The interviewer just asked: "${question}"\n\nGenerate a natural response for the candidate to say:` }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500
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
            if (onDone) onDone(fullResponse);
            return fullResponse;
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

      if (onDone) onDone(fullResponse);
      return fullResponse;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
