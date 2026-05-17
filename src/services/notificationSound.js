// Notification Sound service
// Uses Web Audio API to generate a simple chime tone (no external audio file needed)

export class NotificationSoundService {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  play() {
    if (!this.enabled) return;

    try {
      this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.audioContext;

      // Create a pleasant two-tone chime
      const now = ctx.currentTime;

      // First tone - higher pitch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone - slightly lower, delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.12, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
