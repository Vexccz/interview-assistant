/**
 * Real-time Coaching Service
 * Provides subtle coaching tips while the user is speaking.
 */

export class CoachingService {
  constructor() {
    this.startTime = null;
    this.wordCount = 0;
    this.isActive = false;
    this.currentTip = null;
    this.lastTipTime = 0;
    this.tipCooldown = 5000; // minimum 5s between tip changes
  }

  /**
   * Start coaching for a new answer
   */
  start() {
    this.startTime = Date.now();
    this.wordCount = 0;
    this.isActive = true;
    this.currentTip = null;
  }

  /**
   * Stop coaching
   */
  stop() {
    this.isActive = false;
    this.currentTip = null;
    this.startTime = null;
    this.wordCount = 0;
  }

  /**
   * Update with new transcript text
   * @param {string} fullText - the complete current answer text
   * @returns {{ tip: string|null, type: string }} coaching tip and type
   */
  update(fullText) {
    if (!this.isActive || !this.startTime) {
      return { tip: null, type: 'neutral' };
    }

    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // seconds
    const words = fullText.trim().split(/\s+/).filter(w => w.length > 0);
    this.wordCount = words.length;

    // Don't show tips in first 3 seconds
    if (elapsed < 3) {
      return { tip: null, type: 'neutral' };
    }

    // Respect cooldown
    if (now - this.lastTipTime < this.tipCooldown && this.currentTip) {
      return this.currentTip;
    }

    const wpm = elapsed > 0 ? (this.wordCount / elapsed) * 60 : 0;
    const tip = this.evaluatePerformance(wpm, elapsed, this.wordCount, fullText);

    if (tip.tip !== this.currentTip?.tip) {
      this.lastTipTime = now;
    }
    this.currentTip = tip;
    return tip;
  }

  /**
   * Evaluate speaking performance and return appropriate tip
   */
  evaluatePerformance(wpm, elapsedSeconds, wordCount, text) {
    // Speaking too fast
    if (wpm > 180 && elapsedSeconds > 5) {
      return { tip: 'Speaking too fast — slow down a bit', type: 'warning' };
    }

    // Good pace
    if (wpm >= 120 && wpm <= 150 && elapsedSeconds > 8) {
      return { tip: 'Good pace ✓', type: 'success' };
    }

    // Answer too short (speaking for a while but few words)
    if (elapsedSeconds > 10 && elapsedSeconds < 15 && wordCount < 30) {
      return { tip: 'Add more detail to your answer', type: 'info' };
    }

    // Great length
    if (elapsedSeconds >= 30 && elapsedSeconds <= 90) {
      return { tip: 'Great length ✓', type: 'success' };
    }

    // Too long
    if (elapsedSeconds > 120) {
      return { tip: 'Consider wrapping up — keep it concise', type: 'warning' };
    }

    // Check for specifics (numbers, names, metrics)
    const hasSpecifics = /\d+%|\d+ (years?|months?|people|team|projects?)/i.test(text);
    if (elapsedSeconds > 15 && !hasSpecifics && wordCount > 40) {
      return { tip: 'Try using a specific example', type: 'info' };
    }

    // Moderate pace feedback
    if (wpm > 150 && wpm <= 180 && elapsedSeconds > 8) {
      return { tip: 'Slightly fast — you\'re doing fine', type: 'neutral' };
    }

    return { tip: null, type: 'neutral' };
  }

  /**
   * Get current stats
   */
  getStats() {
    if (!this.startTime) return null;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const wpm = elapsed > 0 ? (this.wordCount / elapsed) * 60 : 0;
    return {
      elapsed: Math.round(elapsed),
      wordCount: this.wordCount,
      wpm: Math.round(wpm)
    };
  }
}

export default CoachingService;
