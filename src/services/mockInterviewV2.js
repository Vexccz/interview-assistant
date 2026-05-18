/**
 * Mock Interview V2 Service
 * Comprehensive mock interview with JD-based question generation,
 * scoring rubrics, follow-up logic, and report generation.
 */

import { getBalancedQuestions, ROLE_TEMPLATES } from './interviewTemplates';

export class MockInterviewV2Service {
  constructor(llmService) {
    this.llm = llmService;
    this.questions = [];
    this.currentQuestionIndex = -1;
    this.answers = [];
    this.isActive = false;
    this.abortController = null;
    this.sessionConfig = null;
    this.startTime = null;
    this.questionStartTime = null;
  }

  /**
   * Initialize a new interview session
   */
  start(config) {
    this.isActive = true;
    this.questions = [];
    this.answers = [];
    this.currentQuestionIndex = -1;
    this.sessionConfig = config;
    this.startTime = Date.now();
    this.questionStartTime = null;
  }

  stop() {
    this.isActive = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Generate questions based on JD + resume or use template
   */
  async generateQuestions({ mode, roleId, jobDescription, resume, difficulty, questionCount, persona, onChunk, onDone }) {
    if (!this.llm) throw new Error('LLM service not available');

    this.abortController = new AbortController();

    if (mode === 'template' && roleId) {
      // Use built-in templates
      const questions = getBalancedQuestions(roleId, { count: questionCount, difficulty });
      this.questions = questions.map((q, i) => ({
        id: i,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty,
        source: 'template'
      }));
      if (onDone) onDone(this.questions);
      return this.questions;
    }

    // Custom mode - generate from JD + resume using LLM
    const systemPrompt = `You are an expert interview question generator. Analyze the job description and resume to create tailored interview questions.

RULES:
- Generate exactly ${questionCount} questions
- Mix: ~40% behavioral, ~40% technical, ~20% situational
- Difficulty level: ${difficulty}
- Each question should be specific to the role/JD, not generic
- Questions should test skills mentioned in the JD
- If resume is provided, include questions about their specific experience

${persona ? `Interviewer style: ${persona}` : ''}

OUTPUT FORMAT (JSON array, no markdown):
[{"text": "question text", "type": "behavioral|technical|situational", "difficulty": "${difficulty}"}]

Only output the JSON array, nothing else.`;

    const userPrompt = `JOB DESCRIPTION:\n${jobDescription || 'General interview'}\n\n${resume ? `CANDIDATE RESUME:\n${resume}` : 'No resume provided.'}\n\nGenerate ${questionCount} interview questions.`;

    try {
      const body = {
        model: this.llm.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        temperature: 0.8,
        max_tokens: 2000
      };

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
        throw new Error(`LLM API error (${response.status})`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON from response (handle markdown code blocks)
      let parsed;
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // Fallback: try to extract JSON array
        const match = content.match(/\[[\s\S]*\]/);
        parsed = match ? JSON.parse(match[0]) : [];
      }

      this.questions = parsed.map((q, i) => ({
        id: i,
        text: q.text,
        type: q.type || 'behavioral',
        difficulty: q.difficulty || difficulty,
        source: 'generated'
      }));

      if (onDone) onDone(this.questions);
      return this.questions;
    } catch (err) {
      if (err.name === 'AbortError') return [];
      throw err;
    }
  }

  /**
   * Get the next question
   */
  getNextQuestion() {
    this.currentQuestionIndex++;
    this.questionStartTime = Date.now();
    if (this.currentQuestionIndex >= this.questions.length) {
      return null; // Interview complete
    }
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (this.currentQuestionIndex < 0 || this.currentQuestionIndex >= this.questions.length) return null;
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * Score an answer using LLM
   */
  async scoreAnswer({ question, answer, jobDescription, resume, onChunk, onDone }) {
    if (!this.llm) throw new Error('LLM service not available');

    this.abortController = new AbortController();

    const timeTaken = this.questionStartTime ? Math.round((Date.now() - this.questionStartTime) / 1000) : 0;

    const systemPrompt = `You are an expert interview coach scoring a candidate's answer.

Score the answer on these 4 criteria (each 1-10):
1. Relevance - How well does the answer address the question?
2. Specificity - Does it use concrete examples, numbers, details?
3. Structure - Is it well-organized (STAR method, clear flow)?
4. Confidence - Does it sound professional and assured?

Also provide:
- Overall score (average of 4 criteria, rounded)
- Brief feedback (2-3 sentences)
- Whether a follow-up question is needed (if score < 5)

OUTPUT FORMAT (JSON only, no markdown):
{"relevance": X, "specificity": X, "structure": X, "confidence": X, "overall": X, "feedback": "...", "needsFollowUp": true/false, "followUpQuestion": "..." }

Only output JSON, nothing else.`;

    const userPrompt = `QUESTION: "${question.text}"
TYPE: ${question.type} | DIFFICULTY: ${question.difficulty}
CANDIDATE'S ANSWER: "${answer}"
TIME TAKEN: ${timeTaken} seconds
${jobDescription ? `\nJOB CONTEXT: ${jobDescription.slice(0, 500)}` : ''}
${resume ? `\nRESUME CONTEXT: ${resume.slice(0, 500)}` : ''}

Score this answer.`;

    try {
      const body = {
        model: this.llm.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 500
      };

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
        throw new Error(`LLM API error (${response.status})`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      let score;
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        score = JSON.parse(cleaned);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        score = match ? JSON.parse(match[0]) : { relevance: 5, specificity: 5, structure: 5, confidence: 5, overall: 5, feedback: 'Unable to parse evaluation.', needsFollowUp: false };
      }

      // Ensure all fields exist
      score = {
        relevance: score.relevance || 5,
        specificity: score.specificity || 5,
        structure: score.structure || 5,
        confidence: score.confidence || 5,
        overall: score.overall || Math.round((score.relevance + score.specificity + score.structure + score.confidence) / 4),
        feedback: score.feedback || '',
        needsFollowUp: score.needsFollowUp || false,
        followUpQuestion: score.followUpQuestion || ''
      };

      // Record the answer
      const entry = {
        questionIndex: this.currentQuestionIndex,
        question: question,
        answer: answer,
        score: score,
        timeTaken: timeTaken,
        timestamp: Date.now()
      };
      this.answers.push(entry);

      // If follow-up needed, insert it as next question
      if (score.needsFollowUp && score.followUpQuestion && score.overall < 5) {
        const followUp = {
          id: this.questions.length,
          text: score.followUpQuestion,
          type: question.type,
          difficulty: question.difficulty,
          source: 'follow-up',
          parentIndex: this.currentQuestionIndex
        };
        // Insert after current question
        this.questions.splice(this.currentQuestionIndex + 1, 0, followUp);
      }

      if (onDone) onDone(score, entry);
      return { score, entry };
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  /**
   * Generate end-of-session report
   */
  async generateReport({ jobDescription, resume, onChunk, onDone }) {
    if (!this.llm) throw new Error('LLM service not available');

    this.abortController = new AbortController();

    const totalTime = Math.round((Date.now() - this.startTime) / 1000);
    const avgScore = this.answers.length > 0
      ? Math.round(this.answers.reduce((sum, a) => sum + a.score.overall, 0) / this.answers.length * 10) / 10
      : 0;

    const lowScoring = this.answers.filter(a => a.score.overall < 6);

    // Build Q&A summary for LLM
    const qaSummary = this.answers.map((a, i) => 
      `Q${i + 1} (${a.question.type}, ${a.question.difficulty}): "${a.question.text}"\nAnswer: "${a.answer.slice(0, 300)}"\nScore: ${a.score.overall}/10`
    ).join('\n\n');

    const systemPrompt = `You are an expert interview coach generating a performance report.

Based on the interview session, provide:
1. 3-5 strengths (short phrases)
2. 3-5 areas to improve (short phrases)
3. For each question scored below 6/10, provide a suggested better answer (2-3 sentences)
4. Overall assessment (2-3 sentences)

OUTPUT FORMAT (JSON only, no markdown):
{
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "suggestedAnswers": [{"questionIndex": 0, "question": "...", "suggestedAnswer": "..."}],
  "assessment": "..."
}

Only output JSON.`;

    const userPrompt = `INTERVIEW SESSION SUMMARY:
Total Questions: ${this.answers.length}
Average Score: ${avgScore}/10
Total Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s
Low-scoring questions: ${lowScoring.length}

${jobDescription ? `JOB: ${jobDescription.slice(0, 300)}` : ''}

Q&A DETAILS:
${qaSummary}

Generate the performance report.`;

    try {
      const body = {
        model: this.llm.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        temperature: 0.5,
        max_tokens: 1500
      };

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
        throw new Error(`LLM API error (${response.status})`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';

      let report;
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        report = JSON.parse(cleaned);
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        report = match ? JSON.parse(match[0]) : { strengths: [], improvements: [], suggestedAnswers: [], assessment: '' };
      }

      // Build full report object
      const fullReport = {
        ...report,
        overallScore: avgScore,
        totalQuestions: this.answers.length,
        totalTime: totalTime,
        answers: this.answers,
        scoreBreakdown: this.answers.map(a => ({
          questionIndex: a.questionIndex,
          questionText: a.question.text,
          questionType: a.question.type,
          score: a.score.overall,
          timeTaken: a.timeTaken
        })),
        typeBreakdown: {
          behavioral: this._getTypeAvg('behavioral'),
          technical: this._getTypeAvg('technical'),
          situational: this._getTypeAvg('situational')
        },
        timestamp: Date.now()
      };

      // Save to localStorage for history
      this._saveSession(fullReport);

      if (onDone) onDone(fullReport);
      return fullReport;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      throw err;
    }
  }

  /**
   * Get average score for a question type
   */
  _getTypeAvg(type) {
    const typed = this.answers.filter(a => a.question.type === type);
    if (typed.length === 0) return 0;
    return Math.round(typed.reduce((sum, a) => sum + a.score.overall, 0) / typed.length * 10) / 10;
  }

  /**
   * Save session to localStorage
   */
  _saveSession(report) {
    try {
      const history = JSON.parse(localStorage.getItem('mockInterviewV2History') || '[]');
      history.push({
        id: Date.now(),
        date: new Date().toISOString(),
        overallScore: report.overallScore,
        totalQuestions: report.totalQuestions,
        totalTime: report.totalTime,
        config: this.sessionConfig,
        scoreBreakdown: report.scoreBreakdown,
        typeBreakdown: report.typeBreakdown
      });
      // Keep last 50 sessions
      if (history.length > 50) history.splice(0, history.length - 50);
      localStorage.setItem('mockInterviewV2History', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save mock interview history:', e);
    }
  }

  /**
   * Get session history for trend display
   */
  static getHistory() {
    try {
      return JSON.parse(localStorage.getItem('mockInterviewV2History') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Get progress stats
   */
  getProgress() {
    return {
      currentQuestion: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length,
      answeredCount: this.answers.length,
      averageScore: this.answers.length > 0
        ? Math.round(this.answers.reduce((sum, a) => sum + a.score.overall, 0) / this.answers.length * 10) / 10
        : 0
    };
  }

  reset() {
    this.stop();
    this.questions = [];
    this.answers = [];
    this.currentQuestionIndex = -1;
    this.sessionConfig = null;
    this.startTime = null;
    this.questionStartTime = null;
  }
}

export default MockInterviewV2Service;
