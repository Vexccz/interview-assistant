// WebRTC Call Recorder Service
// Records both sides of a video call using Electron desktopCapturer
// Combines screen + system audio + mic audio into one .webm recording

export class WebRTCRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.stream = null;
    this.onStatusChange = null;
    this.onTimerUpdate = null;
  }

  async start() {
    if (this.isRecording) return;

    try {
      // Get screen + system audio via desktopCapturer
      const screenStream = await this._getScreenStream();
      
      // Get mic audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // Combine all tracks
      const combinedTracks = [];

      // Add video track from screen
      const videoTracks = screenStream.getVideoTracks();
      if (videoTracks.length > 0) {
        combinedTracks.push(videoTracks[0]);
      }

      // Mix system audio + mic audio using AudioContext
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // System audio from screen capture
      const systemAudioTracks = screenStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        const systemSource = audioContext.createMediaStreamSource(
          new MediaStream([systemAudioTracks[0]])
        );
        systemSource.connect(destination);
      }

      // Mic audio
      const micAudioTracks = micStream.getAudioTracks();
      if (micAudioTracks.length > 0) {
        const micSource = audioContext.createMediaStreamSource(
          new MediaStream([micAudioTracks[0]])
        );
        micSource.connect(destination);
      }

      // Add mixed audio track
      const mixedAudioTracks = destination.stream.getAudioTracks();
      if (mixedAudioTracks.length > 0) {
        combinedTracks.push(mixedAudioTracks[0]);
      }

      this.stream = new MediaStream(combinedTracks);
      this._audioContext = audioContext;
      this._micStream = micStream;
      this._screenStream = screenStream;

      // Create MediaRecorder
      const mimeType = this._getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this._cleanup();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.startTime = Date.now();
      this._startTimer();

      if (this.onStatusChange) {
        this.onStatusChange({ recording: true });
      }

      return true;
    } catch (err) {
      console.error('WebRTC Recorder: Failed to start', err);
      this._cleanup();
      throw err;
    }
  }

  stop() {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        this._cleanup();
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
      this._stopTimer();

      if (this.onStatusChange) {
        this.onStatusChange({ recording: false });
      }
    });
  }

  async save() {
    const blob = await this.stop();
    if (!blob) return null;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `interview-call-${timestamp}.webm`;

    // Try to save via Electron dialog
    if (window.electronAPI?.saveFile) {
      const buffer = await blob.arrayBuffer();
      await window.electronAPI.saveFile({
        data: Array.from(new Uint8Array(buffer)),
        filename,
        filters: [{ name: 'WebM Video', extensions: ['webm'] }]
      });
    } else {
      // Fallback: browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    return filename;
  }

  getElapsedTime() {
    return this.elapsedSeconds;
  }

  getFormattedTime() {
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async _getScreenStream() {
    // Use Electron desktopCapturer if available
    if (window.electronAPI?.getDesktopSources) {
      const sources = await window.electronAPI.getDesktopSources();
      // Pick the entire screen or first available source
      const source = sources.find(s => s.name === 'Entire Screen') || sources[0];
      
      if (source) {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30
            }
          }
        });
      }
    }

    // Fallback: use getDisplayMedia (requires user interaction)
    return await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1920, height: 1080, frameRate: 30 },
      audio: true
    });
  }

  _getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
  }

  _startTimer() {
    this.elapsedSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.getFormattedTime());
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  _cleanup() {
    this._stopTimer();

    if (this._audioContext) {
      this._audioContext.close().catch(() => {});
      this._audioContext = null;
    }

    if (this._micStream) {
      this._micStream.getTracks().forEach(t => t.stop());
      this._micStream = null;
    }

    if (this._screenStream) {
      this._screenStream.getTracks().forEach(t => t.stop());
      this._screenStream = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }
}
