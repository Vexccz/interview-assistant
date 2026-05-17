// Speaker Diarization service
// Uses audio energy levels + timing heuristics to detect who is speaking
// If mic input is active = user speaking
// If system audio or silence gap > 2s then new speech = interviewer

export class DiarizationService {
  constructor() {
    this.currentSpeaker = null; // 'user' | 'interviewer'
    this.lastSpeechTime = null;
    this.silenceGap = 2000; // 2 seconds
    this.micActive = false;
    this.audioContext = null;
    this.micAnalyser = null;
    this.micStream = null;
    this.checkInterval = null;
    this.onSpeakerChange = null;
    this.micThreshold = -45; // dB threshold for mic activity
  }

  async start(onSpeakerChange) {
    this.onSpeakerChange = onSpeakerChange;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.audioContext.createAnalyser();
      this.micAnalyser.fftSize = 2048;
      source.connect(this.micAnalyser);

      const dataArray = new Float32Array(this.micAnalyser.fftSize);

      this.checkInterval = setInterval(() => {
        this.micAnalyser.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const db = 20 * Math.log10(rms || 0.0001);

        const wasMicActive = this.micActive;
        this.micActive = db > this.micThreshold;

        if (this.micActive) {
          this.lastSpeechTime = Date.now();
          if (this.currentSpeaker !== 'user') {
            this.currentSpeaker = 'user';
            if (this.onSpeakerChange) this.onSpeakerChange('user');
          }
        } else {
          // If silence for > 2s and then speech detected from transcript
          // it's likely the interviewer (handled externally via transcript callback)
          if (wasMicActive && !this.micActive) {
            // Mic went silent - next speech from transcript is likely interviewer
          }
        }
      }, 100);
    } catch (err) {
      console.error('Diarization: Failed to access mic for energy detection:', err);
    }
  }

  // Called when transcript receives new text
  // If mic is not active and silence gap exceeded, mark as interviewer
  onTranscriptReceived() {
    const now = Date.now();
    const silenceDuration = this.lastSpeechTime ? (now - this.lastSpeechTime) : this.silenceGap + 1;

    if (!this.micActive && silenceDuration > this.silenceGap) {
      if (this.currentSpeaker !== 'interviewer') {
        this.currentSpeaker = 'interviewer';
        if (this.onSpeakerChange) this.onSpeakerChange('interviewer');
      }
    } else if (this.micActive) {
      if (this.currentSpeaker !== 'user') {
        this.currentSpeaker = 'user';
        if (this.onSpeakerChange) this.onSpeakerChange('user');
      }
    }

    this.lastSpeechTime = now;
  }

  getCurrentSpeaker() {
    return this.currentSpeaker;
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.currentSpeaker = null;
    this.micActive = false;
  }
}
