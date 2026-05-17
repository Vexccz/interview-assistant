import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockInterviewService } from '../services/mockInterview';
import { PersonasService, PERSONAS } from '../services/personas';
import { t } from '../services/i18n';

function MockInterview({ settings, llmService, onClose, language }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'persona_select' | 'asking' | 'waiting' | 'evaluating'
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const mockRef = useRef(null);
  const recognitionRef = useRef(null);
  const personasRef = useRef(new PersonasService());

  useEffect(() => {
    if (llmService) {
      mockRef.current = new MockInterviewService(llmService);
    }
    return () => {
      if (mockRef.current) mockRef.current.stop();
      stopListening();
    };
  }, [llmService]);

  const selectPersona = () => {
    setStatus('persona_select');
  };

  const startWithPersona = async (personaId) => {
    const persona = personasRef.current.get(personaId);
    setSelectedPersona(persona);
    personasRef.current.setActive(personaId);
    startInterview(persona);
  };

  const startInterview = async (persona) => {
    if (!mockRef.current) return;
    mockRef.current.start();
    setIsGenerating(true);
    setCurrentQuestion('');
    setStatus('asking');

    const systemPrompt = persona ? persona.systemPrompt : '';

    try {
      await mockRef.current.generateFirstQuestion({
        resume: settings.resume,
        jobDescription: settings.jobDescription,
        companyInfo: settings.companyInfo,
        systemPrompt,
        onChunk: (chunk, full) => setCurrentQuestion(full),
        onDone: (full) => {
          setCurrentQuestion(full);
          setIsGenerating(false);
          setStatus('waiting');
          startListening();
        }
      });
    } catch (err) {
      console.error('Mock interview error:', err);
      setIsGenerating(false);
      setStatus('idle');
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'bm' ? 'ms-MY' : 'en-US';

    let finalText = '';

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setUserAnswer(finalText + interim);
    };

    recognitionRef.current.onend = () => {
      if (status === 'waiting' && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !mockRef.current) return;

    stopListening();
    setStatus('evaluating');
    setIsGenerating(true);
    setEvaluation('');

    const answer = userAnswer.trim();
    const question = currentQuestion;

    // Add to history
    const entry = { question, answer, evaluation: '' };
    setHistory(prev => [...prev, entry]);

    try {
      // Evaluate the answer
      await mockRef.current.evaluateAnswer({
        question,
        answer,
        resume: settings.resume,
        jobDescription: settings.jobDescription,
        systemPrompt: selectedPersona?.systemPrompt || '',
        onChunk: (chunk, full) => setEvaluation(full),
        onDone: async (evalText) => {
          setEvaluation(evalText);
          setHistory(prev => {
            const updated = [...prev];
            updated[updated.length - 1].evaluation = evalText;
            return updated;
          });

          // Generate next question
          setCurrentQuestion('');
          setUserAnswer('');
          setStatus('asking');

          await mockRef.current.generateFollowUp({
            answer,
            previousQuestions: [...history, { question, answer }],
            resume: settings.resume,
            jobDescription: settings.jobDescription,
            companyInfo: settings.companyInfo,
            systemPrompt: selectedPersona?.systemPrompt || '',
            onChunk: (chunk, full) => setCurrentQuestion(full),
            onDone: (full) => {
              setCurrentQuestion(full);
              setIsGenerating(false);
              setStatus('waiting');
              setEvaluation('');
              startListening();
            }
          });
        }
      });
    } catch (err) {
      console.error('Mock interview error:', err);
      setIsGenerating(false);
      setStatus('waiting');
    }
  };

  const endInterview = () => {
    stopListening();
    if (mockRef.current) mockRef.current.stop();
    setStatus('idle');
    setSelectedPersona(null);
  };

  const personas = Object.values(PERSONAS);

  return (
    <div className="panel mock-interview-panel">
      <div className="panel-header">
        <h2>🎭 Mock Interview</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="mock-interview-content">
        {status === 'idle' && (
          <div className="mock-idle">
            <p className="mock-description">
              AI will act as your interviewer. Choose a persona or start with a general interview.
            </p>
            <button className="btn-save" onClick={selectPersona}>
              Choose Interviewer Persona
            </button>
            <button className="btn-ollama" onClick={() => startInterview(null)} style={{ marginTop: '8px' }}>
              Quick Start (General)
            </button>
          </div>
        )}

        {/* Persona Selection */}
        {status === 'persona_select' && (
          <div className="persona-grid">
            {personas.map(persona => (
              <div
                key={persona.id}
                className="persona-card"
                onClick={() => startWithPersona(persona.id)}
              >
                <span className="persona-icon">{persona.icon}</span>
                <span className="persona-name">{persona.name}</span>
                <span className="persona-desc">{persona.description}</span>
              </div>
            ))}
            <button className="btn-cancel" onClick={() => setStatus('idle')} style={{ marginTop: '8px' }}>
              ← Back
            </button>
          </div>
        )}

        {status !== 'idle' && status !== 'persona_select' && (
          <>
            {/* Active persona indicator */}
            {selectedPersona && (
              <div className="active-persona-badge">
                {selectedPersona.icon} {selectedPersona.name}
              </div>
            )}

            {/* Current Question */}
            <div className="mock-section">
              <span className="section-label">🎤 INTERVIEWER</span>
              <div className="mock-question">
                {currentQuestion || (isGenerating ? 'Thinking...' : '')}
              </div>
            </div>

            {/* User Answer */}
            {status === 'waiting' && (
              <div className="mock-section">
                <span className="section-label">🗣️ YOUR ANSWER</span>
                <div className="mock-answer">
                  {userAnswer || 'Listening... speak your answer'}
                </div>
                <div className="mock-actions">
                  <button className="btn-save" onClick={submitAnswer} disabled={!userAnswer.trim()}>
                    Submit Answer
                  </button>
                  <button className="btn-cancel" onClick={endInterview}>
                    End Interview
                  </button>
                </div>
              </div>
            )}

            {/* Evaluation */}
            {evaluation && (
              <div className="mock-section">
                <span className="section-label">📊 EVALUATION</span>
                <div className="mock-evaluation">
                  {evaluation.split('\n').map((line, i) => (
                    <span key={i} style={{ display: 'block' }}>{line}</span>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="mock-section">
                <span className="section-label">📋 HISTORY ({history.length} questions)</span>
                <div className="mock-history">
                  {history.map((entry, i) => (
                    <div key={i} className="mock-history-item">
                      <div className="mock-history-q">Q{i + 1}: {entry.question}</div>
                      <div className="mock-history-a">A: {entry.answer}</div>
                      {entry.evaluation && (
                        <div className="mock-history-eval">{entry.evaluation}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MockInterview;
