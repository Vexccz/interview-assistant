import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Overlay from './components/Overlay';
import Settings from './components/Settings';
import Controls from './components/Controls';
import QuestionBank from './components/QuestionBank';
import Analytics from './components/Analytics';
import { SpeechToText } from './services/stt';
import { LLMService } from './services/llm';
import { AnalyticsService } from './services/analytics';
import { TranscriptService } from './services/transcript';
import { t } from './services/i18n';

const DEFAULT_SETTINGS = {
  resume: '',
  jobDescription: '',
  companyInfo: '',
  llmApiKey: '',
  llmBaseUrl: 'https://api.openai.com/v1',
  llmModel: 'gpt-4',
  deepgramApiKey: '',
  useDeepgram: false,
  audioMode: 'mic', // 'mic' | 'system' | 'both'
  enableNoiseGate: true,
  responseMode: 'detailed', // 'concise' | 'detailed'
  useStar: true,
  bulletMode: false,
  fontSize: 14,
  opacity: 0.85,
  theme: 'dark',
  language: 'en'
};

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};

function App() {
  const [mode, setMode] = useState('stopped'); // 'stopped' | 'listening' | 'paused' | 'hidden'
  const [showSettings, setShowSettings] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionType, setQuestionType] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [conversationHistory, setConversationHistory] = useState([]);

  const sttRef = useRef(null);
  const llmRef = useRef(null);
  const analyticsRef = useRef(new AnalyticsService());
  const transcriptRef = useRef(new TranscriptService());
  const questionBufferRef = useRef('');
  const silenceTimerRef = useRef(null);
  const questionTimerRef = useRef(null);

  const isListening = mode === 'listening';

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI) {
        const saved = await window.electronAPI.getSettings();
        if (saved) setSettings(prev => ({ ...DEFAULT_SETTINGS, ...saved }));
      } else {
        const saved = localStorage.getItem('interview-settings');
        if (saved) {
          try {
            setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }));
          } catch (e) {}
        }
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

  // Listen for global shortcut - cycle modes
  useEffect(() => {
    if (window.electronAPI) {
      const cleanup = window.electronAPI.onToggleListening(() => {
        setMode(prev => {
          if (prev === 'stopped') return 'listening';
          if (prev === 'listening') return 'paused';
          if (prev === 'paused') return 'hidden';
          if (prev === 'hidden') return 'listening';
          return 'listening';
        });
      });
      return cleanup;
    }
  }, []);

  // Question timer
  useEffect(() => {
    if (isListening) {
      questionTimerRef.current = setInterval(() => {
        setQuestionTimer(analyticsRef.current.getQuestionTimer());
      }, 1000);
    } else {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
    }
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [isListening]);

  // Generate response when question is complete
  const generateResponse = useCallback(async (question) => {
    if (!llmRef.current || !question.trim()) return;

    setIsGenerating(true);
    setResponse('');

    try {
      const result = await llmRef.current.generateResponse({
        question,
        context: {
          resume: settings.resume,
          jobDescription: settings.jobDescription,
          companyInfo: settings.companyInfo,
          conversationHistory
        },
        responseMode: settings.responseMode,
        useStar: settings.useStar,
        bulletMode: settings.bulletMode,
        language: settings.language,
        onChunk: (chunk, full) => {
          setResponse(full);
        },
        onDone: (full, meta) => {
          setIsGenerating(false);
          setQuestionType(meta.questionType);
          setConfidence(meta.confidence);
          setConversationHistory(prev => [...prev, { question, response: full }]);

          // Record in analytics and transcript
          analyticsRef.current.recordQuestion(question, meta.questionType, meta.confidence);
          transcriptRef.current.addEntry(question, full, meta.questionType);
        }
      });

      if (result) {
        setQuestionType(result.questionType);
        setConfidence(result.confidence);
      }
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

  // Start/stop listening based on mode
  useEffect(() => {
    if (mode === 'listening') {
      sttRef.current = new SpeechToText({
        onTranscript: handleTranscript,
        onPartial: handlePartial,
        useDeepgram: settings.useDeepgram,
        deepgramApiKey: settings.deepgramApiKey,
        audioMode: settings.audioMode,
        enableNoiseGate: settings.enableNoiseGate,
        language: settings.language
      });
      sttRef.current.start();

      // Start analytics if not started
      if (!analyticsRef.current.startTime) {
        analyticsRef.current.start();
        transcriptRef.current.start();
      }
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
  }, [mode, handleTranscript, handlePartial, settings.useDeepgram, settings.deepgramApiKey, settings.audioMode, settings.enableNoiseGate, settings.language]);

  const handleCycleMode = () => {
    setMode(prev => {
      if (prev === 'stopped') return 'listening';
      if (prev === 'listening') return 'paused';
      if (prev === 'paused') return 'hidden';
      if (prev === 'hidden') return 'listening';
      return 'listening';
    });
  };

  const handleToggleListening = () => {
    if (mode === 'stopped' || mode === 'paused' || mode === 'hidden') {
      setMode('listening');
    } else {
      setMode('paused');
    }
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setPartialTranscript('');
    setResponse('');
    setQuestionType(null);
    setConfidence(null);
    questionBufferRef.current = '';
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    } else {
      localStorage.setItem('interview-settings', JSON.stringify(newSettings));
    }
    setShowSettings(false);
  };

  const handleSaveTranscript = () => {
    transcriptRef.current.download('md');
  };

  const handlePracticeQuestion = (question) => {
    setShowQuestionBank(false);
    setTranscript(question);
    questionBufferRef.current = '';
    generateResponse(question);
  };

  const handleEndInterview = () => {
    setMode('stopped');
    setShowAnalytics(true);
  };

  // Apply theme and display settings
  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';
  const containerStyle = {
    '--overlay-opacity': settings.opacity,
    '--font-size': `${settings.fontSize}px`
  };

  // Determine current view key for AnimatePresence
  const getCurrentView = () => {
    if (showSettings) return 'settings';
    if (showQuestionBank) return 'questionBank';
    if (showAnalytics) return 'analytics';
    return 'overlay';
  };

  // Hidden mode - minimal UI
  if (mode === 'hidden') {
    return (
      <motion.div
        className={`app-container ${themeClass} mode-hidden`}
        style={containerStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="hidden-indicator" onClick={handleCycleMode}>
          <span>{t('hidden', settings.language)}</span>
          <span className="hidden-hint">Ctrl+Shift+Space</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`app-container ${themeClass}`} style={containerStyle}>
      <Controls
        mode={mode}
        isListening={isListening}
        onToggle={handleToggleListening}
        onCycleMode={handleCycleMode}
        onSettings={() => setShowSettings(true)}
        onMinimize={() => window.electronAPI?.minimizeWindow()}
        onClear={handleClearTranscript}
        onSaveTranscript={handleSaveTranscript}
        onQuestionBank={() => setShowQuestionBank(true)}
        onAnalytics={handleEndInterview}
        language={settings.language}
      />

      <AnimatePresence mode="wait">
        {showSettings ? (
          <motion.div key="settings" {...pageTransition}>
            <Settings
              settings={settings}
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
              language={settings.language}
            />
          </motion.div>
        ) : showQuestionBank ? (
          <motion.div key="questionBank" {...pageTransition}>
            <QuestionBank
              onClose={() => setShowQuestionBank(false)}
              onPractice={handlePracticeQuestion}
              language={settings.language}
            />
          </motion.div>
        ) : showAnalytics ? (
          <motion.div key="analytics" {...pageTransition}>
            <Analytics
              analytics={analyticsRef.current.getSummary()}
              onClose={() => setShowAnalytics(false)}
              language={settings.language}
            />
          </motion.div>
        ) : (
          <motion.div key="overlay" {...pageTransition}>
            <Overlay
              transcript={transcript}
              partialTranscript={partialTranscript}
              response={response}
              isListening={isListening}
              isGenerating={isGenerating}
              questionType={questionType}
              confidence={confidence}
              questionTimer={questionTimer}
              mode={mode}
              language={settings.language}
              fontSize={settings.fontSize}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
