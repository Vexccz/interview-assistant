// Interview analytics service
// Tracks questions, response times, types, and generates summary

export class AnalyticsService {
  constructor() {
    this.questions = [];
    this.startTime = null;
    this.lastQuestionTime = null;
  }

  start() {
    this.startTime = Date.now();
    this.questions = [];
    this.lastQuestionTime = null;
  }

  recordQuestion(question, questionType, confidence) {
    const now = Date.now();
    const timeSinceLast = this.lastQuestionTime ? (now - this.lastQuestionTime) / 1000 : 0;

    this.questions.push({
      text: question,
      type: questionType?.type || 'general',
      typeLabel: questionType?.label || '💬 General',
      confidence: confidence?.level || 'medium',
      timestamp: now,
      responseTime: timeSinceLast
    });

    this.lastQuestionTime = now;
  }

  getQuestionTimer() {
    if (!this.lastQuestionTime) return 0;
    return Math.floor((Date.now() - this.lastQuestionTime) / 1000);
  }

  getSummary() {
    if (this.questions.length === 0) {
      return { totalQuestions: 0, avgResponseTime: 0, typeBreakdown: {}, topics: [], duration: 0 };
    }

    const totalQuestions = this.questions.length;
    const duration = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    // Average response time (skip first question which has no previous)
    const responseTimes = this.questions.slice(1).map(q => q.responseTime).filter(t => t > 0);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Type breakdown
    const typeBreakdown = {};
    this.questions.forEach(q => {
      typeBreakdown[q.typeLabel] = (typeBreakdown[q.typeLabel] || 0) + 1;
    });

    // Extract topics (simple keyword extraction)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had', 'be', 'been', 'being', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'it', 'its', 'my', 'your', 'his', 'her', 'our', 'their', 'me', 'him', 'us', 'them', 'you', 'i', 'we', 'they', 'she', 'he', 'tell', 'describe', 'explain', 'give', 'time']);

    const wordFreq = {};
    this.questions.forEach(q => {
      const words = q.text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      words.forEach(w => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });

    const topics = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);

    return {
      totalQuestions,
      avgResponseTime,
      typeBreakdown,
      topics,
      duration,
      questions: this.questions
    };
  }

  reset() {
    this.questions = [];
    this.startTime = null;
    this.lastQuestionTime = null;
  }
}
