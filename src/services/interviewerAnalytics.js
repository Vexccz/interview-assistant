// Interviewer Analytics Service
// Analyzes interviewer's speech patterns in real-time
// Detects mood/style: Engaged, Neutral, Challenging

export class InterviewerAnalyticsService {
  constructor() {
    this.questions = [];
    this.currentAnalysis = {
      mood: 'neutral', // 'engaged' | 'neutral' | 'challenging'
      confidence: 0,
      metrics: {
        avgQuestionLength: 0,
        questionsPerMinute: 0,
        followUpRatio: 0,
        toneScore: 0
      }
    };
    this.startTime = null;
    this.listeners = [];
  }

  start() {
    this.startTime = Date.now();
    this.questions = [];
    this._updateAnalysis();
  }

  stop() {
    this.startTime = null;
  }

  // Call this when a new interviewer question is detected
  addQuestion(questionText) {
    if (!this.startTime) this.startTime = Date.now();

    const question = {
      text: questionText,
      timestamp: Date.now(),
      wordCount: questionText.split(/\s+/).length,
      isFollowUp: this._isFollowUp(questionText),
      toneWords: this._analyzeToneWords(questionText),
      length: questionText.length
    };

    this.questions.push(question);
    this._updateAnalysis();
    return this.currentAnalysis;
  }

  getAnalysis() {
    return this.currentAnalysis;
  }

  onAnalysisUpdate(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _updateAnalysis() {
    if (this.questions.length === 0) {
      this.currentAnalysis = {
        mood: 'neutral',
        confidence: 0,
        metrics: { avgQuestionLength: 0, questionsPerMinute: 0, followUpRatio: 0, toneScore: 0 }
      };
      this._notify();
      return;
    }

    // Calculate metrics
    const metrics = this._calculateMetrics();
    const mood = this._determineMood(metrics);

    this.currentAnalysis = {
      mood: mood.label,
      confidence: mood.confidence,
      metrics
    };

    this._notify();
  }

  _calculateMetrics() {
    const questions = this.questions;
    const count = questions.length;

    // Average question length (words)
    const avgQuestionLength = Math.round(
      questions.reduce((sum, q) => sum + q.wordCount, 0) / count
    );

    // Questions per minute
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    const questionsPerMinute = elapsedMinutes > 0 
      ? Math.round((count / elapsedMinutes) * 10) / 10 
      : 0;

    // Follow-up ratio
    const followUps = questions.filter(q => q.isFollowUp).length;
    const followUpRatio = Math.round((followUps / count) * 100) / 100;

    // Tone score (-1 to 1, negative = challenging, positive = engaged)
    let toneScore = 0;
    for (const q of questions) {
      toneScore += q.toneWords.positive - q.toneWords.negative;
    }
    toneScore = count > 0 ? Math.round((toneScore / count) * 100) / 100 : 0;

    return {
      avgQuestionLength,
      questionsPerMinute,
      followUpRatio,
      toneScore
    };
  }

  _determineMood(metrics) {
    let engagedScore = 0;
    let challengingScore = 0;

    // High follow-up ratio = engaged (digging deeper)
    if (metrics.followUpRatio > 0.4) engagedScore += 2;
    else if (metrics.followUpRatio > 0.2) engagedScore += 1;

    // Positive tone words = engaged
    if (metrics.toneScore > 0.3) engagedScore += 2;
    else if (metrics.toneScore > 0) engagedScore += 1;

    // Negative tone words = challenging
    if (metrics.toneScore < -0.3) challengingScore += 2;
    else if (metrics.toneScore < 0) challengingScore += 1;

    // Rapid-fire questions (high QPM) = challenging
    if (metrics.questionsPerMinute > 3) challengingScore += 2;
    else if (metrics.questionsPerMinute > 2) challengingScore += 1;

    // Short questions = rapid fire / challenging
    if (metrics.avgQuestionLength < 8) challengingScore += 1;
    // Long questions = detailed / engaged
    if (metrics.avgQuestionLength > 20) engagedScore += 1;

    // Determine mood
    if (engagedScore > challengingScore + 1) {
      return { label: 'engaged', confidence: Math.min(engagedScore / 5, 1) };
    } else if (challengingScore > engagedScore + 1) {
      return { label: 'challenging', confidence: Math.min(challengingScore / 5, 1) };
    } else {
      return { label: 'neutral', confidence: 0.5 };
    }
  }

  _isFollowUp(text) {
    const lower = text.toLowerCase();
    const followUpPatterns = [
      'tell me more', 'elaborate', 'can you explain', 'what do you mean',
      'go deeper', 'more detail', 'expand on', 'clarify', 'specifically',
      'for example', 'how exactly', 'why did you', 'what happened',
      'and then', 'so what', 'how did that', 'what was the result',
      'could you give', 'walk me through'
    ];
    return followUpPatterns.some(p => lower.includes(p));
  }

  _analyzeToneWords(text) {
    const lower = text.toLowerCase();
    
    const positiveWords = [
      'great', 'interesting', 'impressive', 'excellent', 'good',
      'fantastic', 'wonderful', 'love', 'amazing', 'perfect',
      'nice', 'well done', 'exactly', 'right', 'absolutely'
    ];

    const negativeWords = [
      'but', 'however', 'what about', 'concern', 'issue',
      'problem', 'challenge', 'difficult', 'wrong', 'mistake',
      'fail', 'weakness', 'lack', 'gap', 'why not',
      'disagree', 'doubt', 'risk', 'worry'
    ];

    let positive = 0;
    let negative = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positive++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) negative++;
    }

    return { positive, negative };
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentAnalysis);
      } catch (e) {}
    }
  }

  // Get mood emoji and label for display
  static getMoodDisplay(mood) {
    switch (mood) {
      case 'engaged':
        return { emoji: '😊', label: 'Engaged', color: '#4ade80' };
      case 'challenging':
        return { emoji: '🤔', label: 'Challenging', color: '#f59e0b' };
      case 'neutral':
      default:
        return { emoji: '😐', label: 'Neutral', color: '#94a3b8' };
    }
  }
}
