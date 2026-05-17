// Mock Interview service
// AI acts as interviewer - generates questions based on resume + job description
// Evaluates user answers and asks follow-ups

export class MockInterviewService {
  constructor(llmService) {
    this.llm = llmService;
    this.questions = [];
    this.currentQuestionIndex = -1;
    this.answers = [];
    this.isActive = false;
    this.abortController = null;
  }

  start() {
    this.isActive = true;
    this.questions = [];
    this.answers = [];
    this.currentQuestionIndex = -1;
  }

  stop() {
    this.isActive = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async generateFirstQuestion({ resume, jobDescription, companyInfo, onChunk, onDone }) {
    if (!this.llm) return;

    this.abortController = new AbortController();

    const systemPrompt = `You are a professional interviewer conducting a job interview. 
Your role is to ask relevant interview questions based on the candidate's resume and the job description.

RULES:
- Ask ONE question at a time
- Start with an icebreaker/introduction question
- Mix behavioral, technical, and situational questions
- Be professional but friendly
- Keep questions concise and clear
- Do NOT provide answers, only ask questions

${resume ? `CANDIDATE'S RESUME:\n${resume}\n` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
${companyInfo ? `COMPANY INFO:\n${companyInfo}\n` : ''}`;

    const body = {
      model: this.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Start the interview. Ask your first question.' }
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 200
    };

    return await this._streamRequest(body, onChunk, onDone);
  }

  async generateFollowUp({ answer, previousQuestions, resume, jobDescription, companyInfo, onChunk, onDone }) {
    if (!this.llm) return;

    this.abortController = new AbortController();

    const history = previousQuestions.map((q, i) => 
      `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer || '(no answer)'}`
    ).join('\n\n');

    const systemPrompt = `You are a professional interviewer conducting a job interview.
Ask a follow-up or new question based on the candidate's previous answers.

RULES:
- Ask ONE question at a time
- If the previous answer was weak, ask a follow-up to dig deeper
- If the answer was good, move to a new topic
- Mix question types (behavioral, technical, situational)
- Be professional but friendly
- Keep questions concise

${resume ? `CANDIDATE'S RESUME:\n${resume}\n` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
${companyInfo ? `COMPANY INFO:\n${companyInfo}\n` : ''}

INTERVIEW SO FAR:
${history}`;

    const body = {
      model: this.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `The candidate just answered: "${answer}"\n\nAsk your next question.` }
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 200
    };

    return await this._streamRequest(body, onChunk, onDone);
  }

  async evaluateAnswer({ question, answer, resume, jobDescription, onChunk, onDone }) {
    if (!this.llm) return;

    this.abortController = new AbortController();

    const systemPrompt = `You are an interview coach evaluating a candidate's answer.

Score the answer from 1-10 and provide brief feedback.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Score: X/10
Feedback: [1-2 sentences on what was good and what could improve]
Tip: [1 sentence actionable improvement tip]

SCORING CRITERIA:
- Relevance to the question (0-3 points)
- Use of specific examples/details (0-3 points)  
- Structure and clarity (0-2 points)
- Confidence and professionalism (0-2 points)

${resume ? `CANDIDATE'S RESUME:\n${resume}\n` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}`;

    const body = {
      model: this.llm.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: "${question}"\nCandidate's Answer: "${answer}"\n\nEvaluate this answer.` }
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 200
    };

    return await this._streamRequest(body, onChunk, onDone);
  }

  async _streamRequest(body, onChunk, onDone) {
    try {
      const response = await fetch(`${this.llm.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.llm.apiKey ? { 'Authorization': `Bearer ${this.llm.apiKey}` } : {})
        },
        body: JSON.stringify(body),
        signal: this.abortController?.signal
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

  reset() {
    this.stop();
    this.questions = [];
    this.answers = [];
    this.currentQuestionIndex = -1;
  }
}
