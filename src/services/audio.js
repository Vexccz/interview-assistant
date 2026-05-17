// Audio capture service
// Handles microphone, system audio, and noise cancellation

export class AudioCapture {
  constructor() {
    this.micStream = null;
    this.systemStream = null;
    this.combinedStream = null;
    this.audioContext = null;
    this.noiseGateNode = null;
    this.noiseGateThreshold = -50; // dB
  }

  async requestMicAccess() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.micStream;
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw new Error('Microphone access is required for transcription');
    }
  }

  async requestSystemAudio() {
    // System audio capture via Electron desktopCapturer
    try {
      if (!window.electronAPI?.getDesktopSources) {
        console.warn('Desktop capturer not available');
        return null;
      }

      const sources = await window.electronAPI.getDesktopSources();
      if (!sources || sources.length === 0) return null;

      // Use the first screen source
      const source = sources[0];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      });

      // Extract audio track only, stop video
      const audioTrack = stream.getAudioTracks()[0];
      stream.getVideoTracks().forEach(t => t.stop());

      if (audioTrack) {
        this.systemStream = new MediaStream([audioTrack]);
        return this.systemStream;
      }
      return null;
    } catch (err) {
      console.warn('System audio capture not available:', err);
      return null;
    }
  }

  // Get combined stream based on audio mode
  // mode: 'mic' | 'system' | 'both'
  async getStream(mode = 'mic', enableNoiseGate = true) {
    let stream = null;

    if (mode === 'mic' || mode === 'both') {
      await this.requestMicAccess();
    }
    if (mode === 'system' || mode === 'both') {
      await this.requestSystemAudio();
    }

    if (mode === 'mic') {
      stream = this.micStream;
    } else if (mode === 'system') {
      stream = this.systemStream;
    } else if (mode === 'both') {
      // Combine mic and system audio
      if (this.micStream && this.systemStream) {
        stream = this.combineStreams(this.micStream, this.systemStream);
      } else {
        stream = this.micStream || this.systemStream;
      }
    }

    if (!stream) {
      // Fallback to mic
      await this.requestMicAccess();
      stream = this.micStream;
    }

    // Apply noise gate if enabled
    if (enableNoiseGate && stream) {
      stream = this.applyNoiseGate(stream);
    }

    return stream;
  }

  combineStreams(stream1, stream2) {
    this.audioContext = this.audioContext || new AudioContext();
    const ctx = this.audioContext;

    const source1 = ctx.createMediaStreamSource(stream1);
    const source2 = ctx.createMediaStreamSource(stream2);
    const destination = ctx.createMediaStreamDestination();

    source1.connect(destination);
    source2.connect(destination);

    this.combinedStream = destination.stream;
    return this.combinedStream;
  }

  applyNoiseGate(stream) {
    this.audioContext = this.audioContext || new AudioContext();
    const ctx = this.audioContext;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1;

    source.connect(analyser);
    analyser.connect(gainNode);

    const destination = ctx.createMediaStreamDestination();
    gainNode.connect(destination);

    // Noise gate logic - check volume periodically
    const dataArray = new Float32Array(analyser.fftSize);
    const checkInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = 20 * Math.log10(rms || 0.0001);

      // Gate: if below threshold, mute
      if (db < this.noiseGateThreshold) {
        gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      } else {
        gainNode.gain.setTargetAtTime(1, ctx.currentTime, 0.01);
      }
    }, 50);

    this._noiseGateInterval = checkInterval;
    return destination.stream;
  }

  setNoiseGateThreshold(db) {
    this.noiseGateThreshold = db;
  }

  stop() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.systemStream) {
      this.systemStream.getTracks().forEach(track => track.stop());
      this.systemStream = null;
    }
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => track.stop());
      this.combinedStream = null;
    }
    if (this._noiseGateInterval) {
      clearInterval(this._noiseGateInterval);
      this._noiseGateInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
