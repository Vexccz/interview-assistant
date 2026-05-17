// Audio Recording service - records entire interview for playback
// Uses MediaRecorder API, saves as .webm

export class AudioRecorderService {
  constructor() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.stream = null;
    this.blob = null;
    this.isRecording = false;
    this.startTime = null;
    this.duration = 0;
  }

  async start() {
    try {
      this.chunks = [];
      this.blob = null;
      this.startTime = Date.now();

      // Get mic audio
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.duration = Math.floor((Date.now() - this.startTime) / 1000);
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
    } catch (err) {
      console.error('Failed to start audio recording:', err);
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.isRecording = false;
  }

  getBlob() {
    return this.blob;
  }

  getObjectURL() {
    if (this.blob) {
      return URL.createObjectURL(this.blob);
    }
    return null;
  }

  getDuration() {
    return this.duration;
  }

  save() {
    if (!this.blob) return;
    const url = URL.createObjectURL(this.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-recording-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  reset() {
    this.chunks = [];
    this.blob = null;
    this.isRecording = false;
    this.startTime = null;
    this.duration = 0;
  }
}
