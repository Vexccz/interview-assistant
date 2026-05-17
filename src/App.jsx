import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Overlay from './components/Overlay';
import Settings from './components/Settings';
import Controls from './components/Controls';
import QuestionBank from './components/QuestionBank';
import Analytics from './components/Analytics';
import MockInterview from './components/MockInterview';
import History from './components/History';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import UpdateBanner from './components/UpdateBanner';
import Onboarding from './components/Onboarding';
import ReportCard from './components/ReportCard';
import PrepChecklist from './components/PrepChecklist';
import { SpeechToText } from './services/stt';
import { LLMService } from './services/llm';
import { AnalyticsService } from './services/analytics';
import { TranscriptService } from './services/transcript';
import { AudioRecorderService } from './services/audioRecorder';
import { DiarizationService } from './services/diarization';
import { NotificationSoundService } from './services/notificationSound';
import { HistoryService } from './services/history';
import { ProfilesService } from './services/profiles';
import { PdfExportService } from './services/pdfExport';
import { CoachingService } from './services/coaching';
import ragService from './services/rag';
import { t } from './services/i18n';

const DEFAULT_SETTINGS = {
  resume: '',
  jobDescription: '',
  companyInfo: '',
  companyName: '',
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
  language: 'en',
  enableNotificationSound: true,
  activeProfileId: null,
  enableRAG: false,
  enableCoaching: true
};

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

function App() {
  const [mode, setMode] = useState('stopped'); // 'stopped' | 'listening' | 'paused' | 'hidden'
  const [showSettings, setShowSettings] = useState(false);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showPrepChecklist, setShowPrepChecklist] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionType, setQuestionType] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [answerScore, setAnswerScore] = useState(null);
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [coachingTip, setCoachingTip] = useState(null);

  const sttRef = useRef(null);
  const llmRef = useRef(null);
  const analyticsRef = useRef(new AnalyticsService());
  const transcriptRef = useRef(new TranscriptService());
  const audioRecorderRef = useRef(new AudioRecorderService());
  const diarizationRef = useRef(new DiarizationService());
  const notificationRef = useRef(new NotificationSoundService());
  const coachingRef = useRef(new CoachingService());
  const questionBufferRef = useRef('');
  const silenceTimerRef = useRef(null);
  const questionTimerRef = useRef(null);

  const isListening = mode === 'listening';

  // Check onboarding on mount
  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_complete');
    if (!onboardingDone) {
      setShowOnboarding(true);
    }
  }, []);

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

  // Update notification sound setting
  useEffect(() => {
    notificationRef.current.setEnabled(settings.enableNotificationSound !== false);
  }, [settings.enableNotificationSound]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ? or Ctrl+/ to show shortcuts
      if ((e.key === '?' && !e.ctrlKey && !e.metaKey) || (e.key === '/' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Escape to close panels
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showSettings) { setShowSettings(false); return; }
        if (showQuestionBank) { setShowQuestionBank(false); return; }
        if (showAnalytics) { setShowAnalytics(false); return; }
        if (showMockInterview) { setShowMockInterview(false); return; }
        if (showHistory) { setShowHistory(false); return; }
        if (showReportCard) { setShowReportCard(false); return; }
        if (showPrepChecklist) { setShowPrepChecklist(false); return; }
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSaveTranscript();
            break;
          case 'e':
            e.preventDefault();
            handleExportPdf();
            break;
          case 'm':
            e.preventDefault();
            setShowMockInterview(prev => !prev);
            break;
          case 'h':
            e.preventDefault();
            setShowHistory(prev => !prev);
            break;
          case ',':
            e.preventDefault();
            setShowSettings(prev => !prev);
            break;
          case 'k':
            e.preventDefault();
            handleClearTranscript();
            break;
          case 'p':
            e.preventDefault();
            setShowPrepChecklist(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, showSettings, showQuestionBank, showAnalytics, showMockInterview, showHistory, showReportCard, showPrepChecklist]);

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
    setAnswerScore(null);

    // Stop coaching when generating (interviewer is done speaking)
    coachingRef.current.stop();
    setCoachingTip(null);

    try {
      // Get RAG context if enabled
      let ragContext = '';
      if (settings.enableRAG) {
        ragContext = ragService.formatForContext(question);
      }

      const result = await llmRef.current.generateResponse({
        question,
        context: {
          resume: settings.resume,
          jobDescription: settings.jobDescription,
          companyInfo: settings.companyInfo + ragContext,
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
          const entry = {
            question,
            response: full,
            type: meta.questionType?.label || 'General',
            speaker: currentSpeaker || 'interviewer',
            timestamp: new Date()
          };
          transcriptRef.current.addEntry(question, full, meta.questionType);
          setTranscriptEntries(prev => [...prev, entry]);

          // Play notification sound
          notificationRef.current.play();

          // Generate answer score
          generateAnswerScore(question, full, meta);

          // Start coaching for user's answer
          if (settings.enableCoaching) {
            coachingRef.current.start();
          }
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
  }, [settings, conversationHistory, currentSpeaker]);

  // Answer scoring
  const generateAnswerScore = useCallback(async (question, response, meta) => {
    if (!llmRef.current) return;

    try {
      const scorePrompt = `Rate this interview answer on a scale of 1-10. Consider: relevance to question, use of specifics, structure, and professionalism.

Question: "${question}"
Suggested Answer: "${response}"

Respond in EXACTLY this format (nothing else):
SCORE: X/10
FEEDBACK: [one sentence on how to improve]`;

      const scoreResponse = await fetch(`${llmRef.current.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmRef.current.apiKey ? { 'Authorization': `Bearer ${llmRef.current.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: llmRef.current.model,
          messages: [
            { role: 'user', content: scorePrompt }
          ],
          temperature: 0.3,
          max_tokens: 100
        })
      });

      if (scoreResponse.ok) {
        const data = await scoreResponse.json();
        const text = data.choices?.[0]?.message?.content || '';
        const scoreMatch = text.match(/SCORE:\s*(\d+)\/10/i);
        const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);

        if (scoreMatch) {
          setAnswerScore({
            score: parseInt(scoreMatch[1]),
            feedback: feedbackMatch ? feedbackMatch[1].trim() : ''
          });
        }
      }
    } catch (err) {
      // Score generation is non-critical, silently fail
      console.error('Score generation failed:', err);
    }
  }, []);

  // Handle transcription
  const handleTranscript = useCallback((text) => {
    // Notify diarization service
    diarizationRef.current.onTranscriptReceived();

    questionBufferRef.current += ' ' + text;
    setTranscript(questionBufferRef.current.trim());
    setPartialTranscript('');

    // Update coaching with current text
    if (settings.enableCoaching && coachingRef.current.isActive) {
      const tip = coachingRef.current.update(questionBufferRef.current.trim());
      setCoachingTip(tip.tip ? tip : null);
    }

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
  }, [generateResponse, settings.enableCoaching]);

  const handlePartial = useCallback((text) => {
    setPartialTranscript(text);
  }, []);

  // Speaker change handler
  const handleSpeakerChange = useCallback((speaker) => {
    setCurrentSpeaker(speaker);
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

      // Start audio recording
      audioRecorderRef.current.start();

      // Start diarization
      diarizationRef.current.start(handleSpeakerChange);

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
      // Don't stop recorder on pause, only on full stop
      if (mode === 'stopped') {
        audioRecorderRef.current.stop();
        diarizationRef.current.stop();
      }
    }

    return () => {
      if (sttRef.current) {
        sttRef.current.stop();
      }
    };
  }, [mode, handleTranscript, handlePartial, handleSpeakerChange, settings.useDeepgram, settings.deepgramApiKey, settings.audioMode, settings.enableNoiseGate, settings.language]);

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
    setAnswerScore(null);
    setCoachingTip(null);
    questionBufferRef.current = '';
    coachingRef.current.stop();
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

  const handleExportPdf = () => {
    if (transcriptEntries.length > 0) {
      PdfExportService.exportTranscript(transcriptEntries, {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        totalQuestions: transcriptEntries.length,
        duration: analyticsRef.current.getSummary().duration
      });
    }
  };

  const handlePracticeQuestion = (question) => {
    setShowQuestionBank(false);
    setTranscript(question);
    questionBufferRef.current = '';
    generateResponse(question);
  };

  const handleEndInterview = () => {
    setMode('stopped');
    coachingRef.current.stop();
    setCoachingTip(null);

    // Save to history
    const summary = analyticsRef.current.getSummary();
    HistoryService.addSession({
      duration: summary.duration,
      totalQuestions: summary.totalQuestions,
      transcript: transcriptEntries,
      analytics: summary,
      profileName: settings.activeProfileId
        ? (ProfilesService.getActiveProfile()?.name || 'Default')
        : 'Default'
    });

    setShowReportCard(true);
  };

  const handleOnboardingComplete = (onboardingSettings) => {
    setShowOnboarding(false);
    if (Object.keys(onboardingSettings).length > 0) {
      const newSettings = { ...settings, ...onboardingSettings };
      handleSaveSettings(newSettings);
    }
  };

  // Apply theme and display settings
  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';
  const containerStyle = {
    '--overlay-opacity': settings.opacity,
    '--font-size': `${settings.fontSize}px`
  };

  // Onboarding screen
  if (showOnboarding) {
    return (
      <div className={`app-container ${themeClass}`} style={containerStyle}>
        <Onboarding onComplete={handleOnboardingComplete} initialSettings={settings} />
      </div>
    );
  }

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
      <UpdateBanner />

      <Controls
        mode={mode}
        isListening={isListening}
        onToggle={handleToggleListening}
        onCycleMode={handleCycleMode}
        onSettings={() => setShowSettings(true)}
        onMinimize={() => window.electronAPI?.minimizeWindow()}
        onClear={handleClearTranscript}
        onSaveTranscript={handleSaveTranscript}
        onExportPdf={handleExportPdf}
        onQuestionBank={() => setShowQuestionBank(true)}
        onAnalytics={handleEndInterview}
        onMockInterview={() => setShowMockInterview(true)}
        onHistory={() => setShowHistory(true)}
        onPrepChecklist={() => setShowPrepChecklist(true)}
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
              audioRecorder={audioRecorderRef.current}
              onClose={() => setShowAnalytics(false)}
              language={settings.language}
            />
          </motion.div>
        ) : showMockInterview ? (
          <motion.div key="mockInterview" {...pageTransition}>
            <MockInterview
              settings={settings}
              llmService={llmRef.current}
              onClose={() => setShowMockInterview(false)}
              language={settings.language}
            />
          </motion.div>
        ) : showHistory ? (
          <motion.div key="history" {...pageTransition}>
            <History
              onClose={() => setShowHistory(false)}
              language={settings.language}
            />
          </motion.div>
        ) : showReportCard ? (
          <motion.div key="reportCard" {...pageTransition}>
            <ReportCard
              transcriptEntries={transcriptEntries}
              analytics={analyticsRef.current.getSummary()}
              llmService={llmRef.current}
              settings={settings}
              onClose={() => { setShowReportCard(false); setShowAnalytics(true); }}
            />
          </motion.div>
        ) : showPrepChecklist ? (
          <motion.div key="prepChecklist" {...pageTransition}>
            <PrepChecklist
              settings={settings}
              llmService={llmRef.current}
              onClose={() => setShowPrepChecklist(false)}
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
              currentSpeaker={currentSpeaker}
              answerScore={answerScore}
            />
            {/* Coaching bar */}
            {coachingTip && coachingTip.tip && (
              <div className={`coaching-bar coaching-${coachingTip.type}`}>
                {coachingTip.tip}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
