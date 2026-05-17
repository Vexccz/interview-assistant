import React, { useState, useEffect, useRef, useCallback } from 'react';
import Overlay from './components/Overlay';
import Settings from './components/Settings';
import Controls from './components/Controls';
import { SpeechToText } from './services/stt';
import { LLMService } from './services/llm';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState({
    resume: '',
    jobDescription: '',
    companyInfo: '',
    llmApiKey: '',
    llmBaseUrl: 'https://api.openai.com/v1',
    llmModel: 'gpt-4',
    deepgramApiKey: '',
    useDeepgram: false
  });
  const [conversationHistory, setConversationHistory] = useState([]);

  const sttRef = useRef(null);
  const llmRef = useRef(null);
  const questionBufferRef = useRef('');
  const silenceTimerRef = useRef(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI) {
        const saved = await window.electronAPI.getSettings();
        if (saved) setSettings(saved);
      }
    };
    loadSettings();
  }, []);

  // Initialize LLM service
  useEffect(() => {
    llmRef.current = new LLMService({
      apiKey: settings.llmApiKey,
      baseUrl: settings.llmBaseUrl,
      model: settings.llmModel
    });
  }, [settings.llmApiKey, settings.llmBaseUrl, settings.llmModel]);

  // Listen for global shortcut
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onToggleListening(() => {
        setIsListening(prev => !prev);
      });
      return cleanup;
    }
  }, []);

  // Generate response when question is complete
  const generateResponse = useCallback(async (question) => {
    if (!llmRef.current || !question.trim()) return;

    setIsGenerating(true);
    setResponse('');

    try {
      const fullResponse = await llmRef.current.generateResponse({
        question,
        context: {
          resume: settings.resume,
          jobDescription: settings.jobDescription,
          companyInfo: settings.companyInfo,
          conversationHistory
        },
        onChunk: (chunk, full) => {
          setResponse(full);
        },
        onDone: (full) => {
          setIsGenerating(false);
          setConversationHistory(prev => [...prev, { question, response: full }]);
        }
      });
    } catch (err) {
      console.error('LLM error:', err);
      setResponse(`Error: ${err.message}`);
      setIsGenerating(false);
    }
  }, [settings, conversationHistory]);

  // Handle transcription
  const handleTranscript = useCallback((text) => {
    questionBufferRef.current += ' ' + text;
    setTranscript(questionBufferRef.current.trim());
    setPartialTranscript('');

    // Reset silence timer - generate response after 2s of silence
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      const question = questionBufferRef.current.trim();
      if (question) {
        generateResponse(question);
        questionBufferRef.current = '';
      }
    }, 2000);
  }, [generateResponse]);

  const handlePartial = useCallback((text) => {
    setPartialTranscript(text);
  }, []);

  // Start/stop listening
  useEffect(() => {
    if (isListening) {
      sttRef.current = new SpeechToText({
        onTranscript: handleTranscript,
        onPartial: handlePartial,
        useDeepgram: settings.useDeepgram,
        deepgramApiKey: settings.deepgramApiKey
      });
      sttRef.current.start();
    } else {
      if (sttRef.current) {
        sttRef.current.stop();
        sttRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }

    return () => {
      if (sttRef.current) {
        sttRef.current.stop();
      }
    };
  }, [isListening, handleTranscript, handlePartial, settings.useDeepgram, settings.deepgramApiKey]);

  const handleToggleListening = () => {
    setIsListening(prev => !prev);
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setPartialTranscript('');
    setResponse('');
    questionBufferRef.current = '';
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    }
    setShowSettings(false);
  };

  return (
    <div className="app-container">
      <Controls
        isListening={isListening}
        onToggle={handleToggleListening}
        onSettings={() => setShowSettings(true)}
        onMinimize={() => window.electronAPI?.minimizeWindow()}
        onClear={handleClearTranscript}
      />

      {showSettings ? (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      ) : (
        <Overlay
          transcript={transcript}
          partialTranscript={partialTranscript}
          response={response}
          isListening={isListening}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}

export default App;
