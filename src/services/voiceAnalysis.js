/**
 * Voice Tone Analysis Service
 * Analyzes mic audio in real-time for pitch, speaking rate, and volume.
 */

export class VoiceAnalysisService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.isActive = false;
    this.listeners = [];
    this.checkInterval = null;

    // Tracking state
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.wordCount = 0;
    this.startTime = null;
    this.lastCoaching = null;
    this.coachingCooldown = 8000; // 8s between coaching messages
  }

  /**
   * Start voice analysis
   * @param {MediaStream} existingStream - optional existing mic stream
   */
  async start(existingStream) {
    try {
      this.stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      this.isActive = true;
      this.startTime = Date.now();
      this.pitchHistory = [];
      this.volumeHistory = [];
      this.wordCount = 0;
      this.lastCoaching = null;

      // Analyze every 500ms
      this.checkInterval = setInterval(() => this.analyze(), 500);

      return true;
    } catch (err) {
      console.error('Voice analysis failed to start:', err);
      return false;
    }
  }

  /**
   * Stop voice analysis
   */
  stop() {
    this.isActive = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.startTime = null;
  }

  /**
   * Update word count from STT
   */
  updateWordCount(count) {
    this.wordCount = count;
  }

  /**
   * Analyze current audio buffer
   */
  analyze() {
    if (!this.isActive || !this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(buffer);

    // Get frequency data for pitch
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);

    // Detect pitch using autocorrelation
    const pitch = this.detectPitch(buffer, this.audioContext.sampleRate);

    // Calculate RMS volume
    const volume = this.calculateRMS(buffer);

    // Store history
    if (pitch > 0) this.pitchHistory.push(pitch);
    this.volumeHistory.push(volume);

    // Keep last 20 samples (10 seconds)
    if (this.pitchHistory.length > 20) this.pitchHistory.shift();
    if (this.volumeHistory.length > 20) this.volumeHistory.shift();

    // Generate coaching
    const coaching = this.generateCoaching();
    if (coaching) {
      const now = Date.now();
      if (!this.lastCoaching || now - this.lastCoaching.time > this.coachingCooldown) {
        this.lastCoaching = { ...coaching, time: now };
        this.notify(coaching);
      }
    }
  }

  /**
   * Detect pitch using autocorrelation method
   */
  detectPitch(buffer, sampleRate) {
    // Check if there's enough signal
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return 0; // Too quiet

    // Autocorrelation
    const correlations = new Float32Array(buffer.length);
    for (let lag = 0; lag < buffer.length; lag++) {
      let sum = 0;
      for (let i = 0; i < buffer.length - lag; i++) {
        sum += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = sum;
    }

    // Find the first peak after the initial decline
    let foundPeak = false;
    let peakLag = 0;

    // Skip the first part (high correlation with itself)
    const minLag = Math.floor(sampleRate / 500); // Max 500Hz
    const maxLag = Math.floor(sampleRate / 75);  // Min 75Hz

    let maxCorr = 0;
    for (let lag = minLag; lag < Math.min(maxLag, correlations.length); lag++) {
      if (correlations[lag] > maxCorr) {
        maxCorr = correlations[lag];
        peakLag = lag;
        foundPeak = true;
      }
    }

    if (!foundPeak || peakLag === 0) return 0;

    return sampleRate / peakLag;
  }

  /**
   * Calculate RMS volume
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Generate coaching based on analysis
   */
  generateCoaching() {
    const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    if (elapsed < 5) return null; // Wait 5 seconds before coaching

    // Check speaking rate (WPM)
    const wpm = elapsed > 0 ? (this.wordCount / elapsed) * 60 : 0;
    if (wpm > 180 && elapsed > 8) {
      return { type: 'warning', message: 'Slow down — take a breath 🫁', metric: 'speed' };
    }

    // Check pitch (nervousness indicator)
    if (this.pitchHistory.length >= 5) {
      const avgPitch = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
      const recentPitch = this.pitchHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;

      // If recent pitch is significantly higher than average, user might be nervous
      if (recentPitch > avgPitch * 1.3 && avgPitch > 100) {
        return { type: 'info', message: 'Relax your voice — lower your pitch slightly', metric: 'pitch' };
      }
    }

    // Check volume consistency
    if (this.volumeHistory.length >= 10) {
      const recentVolumes = this.volumeHistory.slice(-5);
      const avgRecent = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      const olderVolumes = this.volumeHistory.slice(-10, -5);
      const avgOlder = olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length;

      // Sudden volume drop = losing confidence
      if (avgOlder > 0.02 && avgRecent < avgOlder * 0.4) {
        return { type: 'warning', message: 'Project your voice — speak up 🔊', metric: 'volume' };
      }
    }

    // Speaking too slowly
    if (wpm > 0 && wpm < 100 && elapsed > 10) {
      return { type: 'info', message: 'Pick up the pace slightly', metric: 'speed' };
    }

    return null;
  }

  /**
   * Subscribe to coaching events
   */
  onCoaching(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notify(coaching) {
    this.listeners.forEach(cb => cb(coaching));
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const wpm = elapsed > 0 ? (this.wordCount / elapsed) * 60 : 0;
    const avgPitch = this.pitchHistory.length > 0
      ? this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length
      : 0;
    const avgVolume = this.volumeHistory.length > 0
      ? this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length
      : 0;

    return {
      wpm: Math.round(wpm),
      pitch: Math.round(avgPitch),
      volume: Math.round(avgVolume * 1000) / 1000,
      elapsed: Math.round(elapsed)
    };
  }
}

export default VoiceAnalysisService;
