// Speech-to-Text service
// Default: Web Speech API (free, no key needed)
// Optional: Deepgram streaming API (requires API key)

import { AudioCapture } from './audio.js';

export class SpeechToText {
  constructor({ onTranscript, onPartial, useDeepgram = false, deepgramApiKey = '', audioMode = 'mic', enableNoiseGate = true, language = 'en' }) {
    this.onTranscript = onTranscript;
    this.onPartial = onPartial;
    this.useDeepgram = useDeepgram && !!deepgramApiKey;
    this.deepgramApiKey = deepgramApiKey;
    this.audioMode = audioMode;
    this.enableNoiseGate = enableNoiseGate;
    this.language = language;
    this.isListening = false;
    this.recognition = null;
    this.dgSocket = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioCapture = new AudioCapture();
  }

  async start() {
    if (this.isListening) return;
    this.isListening = true;

    if (this.useDeepgram) {
      await this.startDeepgram();
    } else {
      this.startWebSpeech();
    }
  }

  stop() {
    this.isListening = false;

    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    if (this.dgSocket) {
      this.dgSocket.close();
      this.dgSocket = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    this.audioCapture.stop();
  }

  // Web Speech API (free, built-in)
  startWebSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Web Speech API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language === 'bm' ? 'ms-MY' : 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript(finalTranscript.trim());
      }
      if (interimTranscript) {
        this.onPartial(interimTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.isListening = false;
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              // Already started
            }
          }
        }, 100);
      }
    };

    this.recognition.start();
  }

  // Deepgram streaming API
  async startDeepgram() {
    try {
      this.mediaStream = await this.audioCapture.getStream(this.audioMode, this.enableNoiseGate);

      const lang = this.language === 'bm' ? 'ms' : 'en';
      const dgUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=${lang}&punctuate=true&interim_results=true&smart_format=true`;

      this.dgSocket = new WebSocket(dgUrl, ['token', this.deepgramApiKey]);

      this.dgSocket.onopen = () => {
        this.mediaRecorder = new MediaRecorder(this.mediaStream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && this.dgSocket?.readyState === WebSocket.OPEN) {
            this.dgSocket.send(event.data);
          }
        };

        this.mediaRecorder.start(250); // Send chunks every 250ms
      };

      this.dgSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;

        if (transcript) {
          if (data.is_final) {
            this.onTranscript(transcript);
          } else {
            this.onPartial(transcript);
          }
        }
      };

      this.dgSocket.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
      };

      this.dgSocket.onclose = () => {
        if (this.isListening) {
          // Attempt reconnect
          setTimeout(() => this.startDeepgram(), 1000);
        }
      };
    } catch (err) {
      console.error('Failed to start Deepgram:', err);
      // Fallback to Web Speech API
      this.useDeepgram = false;
      this.startWebSpeech();
    }
  }
}
