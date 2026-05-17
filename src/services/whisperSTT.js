// Whisper Offline STT Service
// Uses @xenova/transformers (whisper-tiny) for local speech-to-text
// No internet required once model is downloaded

export class WhisperSTTService {
  constructor({ onTranscript, onPartial, onModelStatus, language = 'en' }) {
    this.onTranscript = onTranscript;
    this.onPartial = onPartial;
    this.onModelStatus = onModelStatus || (() => {});
    this.language = language;
    this.isListening = false;
    this.pipeline = null;
    this.modelLoaded = false;
    this.modelLoading = false;
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
    this.audioBuffer = [];
    this.processInterval = null;
    this.SAMPLE_RATE = 16000;
    this.CHUNK_DURATION = 5; // Process every 5 seconds
  }

  async loadModel() {
    if (this.modelLoaded || this.modelLoading) return;
    this.modelLoading = true;
    this.onModelStatus({ status: 'loading', message: 'Downloading Whisper model...' });

    try {
      // Dynamic import to lazy-load transformers.js
      const { pipeline } = await import('@xenova/transformers');
      
      this.pipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            this.onModelStatus({ 
              status: 'loading', 
              message: `Downloading model: ${pct}%`,
              progress: pct
            });
          }
        }
      });

      this.modelLoaded = true;
      this.modelLoading = false;
      this.onModelStatus({ status: 'ready', message: 'Whisper model ready' });
    } catch (err) {
      this.modelLoading = false;
      this.onModelStatus({ status: 'error', message: `Failed to load model: ${err.message}` });
      console.error('Whisper model load error:', err);
      throw err;
    }
  }

  async start() {
    if (this.isListening) return;

    // Ensure model is loaded
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    try {
      // Get microphone stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessor for audio data (worklet would be better but more complex)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioBuffer = [];

      this.processor.onaudioprocess = (event) => {
        if (!this.isListening) return;
        const inputData = event.inputBuffer.getChannelData(0);
        // Copy the float32 audio data
        this.audioBuffer.push(new Float32Array(inputData));
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isListening = true;

      // Process audio chunks periodically
      this.processInterval = setInterval(() => {
        this._processAudioChunk();
      }, this.CHUNK_DURATION * 1000);

    } catch (err) {
      console.error('Whisper STT start error:', err);
      this.stop();
      throw err;
    }
  }

  stop() {
    this.isListening = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    // Process any remaining audio
    if (this.audioBuffer.length > 0) {
      this._processAudioChunk();
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  async _processAudioChunk() {
    if (this.audioBuffer.length === 0 || !this.pipeline) return;

    // Concatenate all buffered audio
    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of this.audioBuffer) {
      combined.set(buf, offset);
      offset += buf.length;
    }
    this.audioBuffer = [];

    // Check if audio has enough energy (skip silence)
    const rms = Math.sqrt(combined.reduce((sum, v) => sum + v * v, 0) / combined.length);
    if (rms < 0.01) return; // Too quiet, skip

    // Show partial indicator
    if (this.onPartial) {
      this.onPartial('...');
    }

    try {
      const result = await this.pipeline(combined, {
        language: this.language === 'bm' ? 'malay' : 'english',
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5
      });

      const text = result?.text?.trim();
      if (text && text.length > 0 && !this._isNoiseOnly(text)) {
        if (this.onTranscript) {
          this.onTranscript(text);
        }
      }
      if (this.onPartial) {
        this.onPartial('');
      }
    } catch (err) {
      console.error('Whisper transcription error:', err);
      if (this.onPartial) {
        this.onPartial('');
      }
    }
  }

  _isNoiseOnly(text) {
    // Filter out common noise transcriptions
    const noisePatterns = [
      /^\[.*\]$/,           // [music], [noise], etc.
      /^\.+$/,              // Just dots
      /^\s*$/,              // Empty/whitespace
      /^(um|uh|hmm)\s*$/i, // Just filler words
      /you$/i               // Common whisper hallucination
    ];
    return noisePatterns.some(p => p.test(text));
  }

  isModelReady() {
    return this.modelLoaded;
  }

  isModelLoading() {
    return this.modelLoading;
  }
}
