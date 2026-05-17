// Audio capture service
// Handles microphone access and optional system audio capture

export class AudioCapture {
  constructor() {
    this.stream = null;
    this.audioContext = null;
  }

  async requestMicAccess() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.stream;
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw new Error('Microphone access is required for transcription');
    }
  }

  async requestSystemAudio() {
    // System audio capture via Electron desktopCapturer
    // This requires the renderer to use desktopCapturer API
    try {
      const sources = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        }
      });

      // Extract audio track only
      const audioTrack = sources.getAudioTracks()[0];
      if (audioTrack) {
        const audioStream = new MediaStream([audioTrack]);
        // Stop video tracks
        sources.getVideoTracks().forEach(t => t.stop());
        return audioStream;
      }
      return null;
    } catch (err) {
      console.warn('System audio capture not available:', err);
      return null;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
