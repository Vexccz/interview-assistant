import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MockInterviewV2Service } from '../services/mockInterviewV2';
import { getAllTemplates } from '../services/interviewTemplates';
import { jsPDF } from 'jspdf';

const DIFFICULTY_OPTIONS = [
  { id: 'easy', label: 'Easy', desc: 'Entry-level' },
  { id: 'medium', label: 'Medium', desc: 'Mid-level' },
  { id: 'hard', label: 'Hard', desc: 'Senior/FAANG' }
];

const QUESTION_COUNTS = [5, 8, 10, 12];

const TIME_LIMITS = [
  { value: 0, label: 'Off' },
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' }
];

function MockInterviewV2({ settings, llmService, onClose, language }) {
  // Phase: 'setup' | 'generating' | 'interview' | 'evaluating' | 'report'
  const [phase, setPhase] = useState('setup');
  const [setupStep, setSetupStep] = useState(1);

  // Setup state
  const [interviewMode, setInterviewMode] = useState(null); // 'custom' | 'template'
  const [selectedRole, setSelectedRole] = useState(null);
  const [jobDescription, setJobDescription] = useState(settings.jobDescription || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(8);
  const [timeLimit, setTimeLimit] = useState(0);

  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [useVoice, setUseVoice] = useState(true);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);

  // Report state
  const [report, setReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Refs
  const serviceRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize service
  useEffect(() => {
    if (llmService) {
      serviceRef.current = new MockInterviewV2Service(llmService);
    }
    setSessionHistory(MockInterviewV2Service.getHistory());
    return () => {
      if (serviceRef.current) serviceRef.current.stop();
      stopListening();
      clearTimer();
    };
  }, [llmService]);

  const templates = getAllTemplates();

  // Timer logic
  const startTimer = useCallback(() => {
    if (timeLimit <= 0) return;
    setTimer(timeLimit);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeLimit]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
    setTimer(0);
  };

  // Speech recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'bm' ? 'ms-MY' : 'en-US';

    let finalText = userAnswer || '';

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
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Start interview
  const handleStartInterview = async () => {
    if (!serviceRef.current) return;

    setPhase('generating');

    const config = {
      mode: interviewMode,
      roleId: selectedRole,
      difficulty,
      questionCount,
      timeLimit
    };

    serviceRef.current.start(config);

    try {
      await serviceRef.current.generateQuestions({
        mode: interviewMode,
        roleId: selectedRole,
        jobDescription: interviewMode === 'custom' ? jobDescription : '',
        resume: settings.resume,
        difficulty,
        questionCount
      });

      // Move to first question
      const first = serviceRef.current.getNextQuestion();
      if (first) {
        setCurrentQuestion(first);
        setPhase('interview');
        startTimer();
        if (useVoice) startListening();
      }
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setPhase('setup');
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !serviceRef.current || !currentQuestion) return;

    stopListening();
    clearTimer();
    setIsEvaluating(true);
    setShowEvaluation(true);

    try {
      const result = await serviceRef.current.scoreAnswer({
        question: currentQuestion,
        answer: userAnswer.trim(),
        jobDescription: settings.jobDescription,
        resume: settings.resume
      });

      if (result) {
        setEvaluation(result.score);
      }
    } catch (err) {
      console.error('Scoring failed:', err);
      setEvaluation({ overall: 5, relevance: 5, specificity: 5, structure: 5, confidence: 5, feedback: 'Evaluation failed.', needsFollowUp: false });
    }

    setIsEvaluating(false);
  };

  // Skip question
  const handleSkip = () => {
    stopListening();
    clearTimer();
    moveToNext();
  };

  // Move to next question
  const moveToNext = () => {
    setShowEvaluation(false);
    setEvaluation(null);
    setUserAnswer('');

    const next = serviceRef.current.getNextQuestion();
    if (next) {
      setCurrentQuestion(next);
      startTimer();
      if (useVoice) startListening();
    } else {
      // Interview complete - generate report
      handleGenerateReport();
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    setPhase('report');
    setIsGeneratingReport(true);

    try {
      const result = await serviceRef.current.generateReport({
        jobDescription: settings.jobDescription,
        resume: settings.resume
      });

      if (result) {
        setReport(result);
        setSessionHistory(MockInterviewV2Service.getHistory());
      }
    } catch (err) {
      console.error('Report generation failed:', err);
      // Build basic report from answers
      const answers = serviceRef.current.answers;
      setReport({
        overallScore: answers.length > 0 ? Math.round(answers.reduce((s, a) => s + a.score.overall, 0) / answers.length * 10) / 10 : 0,
        totalQuestions: answers.length,
        totalTime: Math.round((Date.now() - serviceRef.current.startTime) / 1000),
        answers: answers,
        strengths: ['Completed the interview'],
        improvements: ['Report generation failed - review individual scores'],
        suggestedAnswers: [],
        assessment: 'Unable to generate full assessment.',
        scoreBreakdown: answers.map(a => ({ questionText: a.question.text, score: a.score.overall })),
        typeBreakdown: { behavioral: 0, technical: 0, situational: 0 }
      });
    }

    setIsGeneratingReport(false);
  };

  // Export PDF
  const handleExportPdf = () => {
    if (!report) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text('Mock Interview Report', 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text('Overall Score: ' + report.overallScore + '/10', 20, y);
    y += 8;
    doc.text('Questions: ' + report.totalQuestions + ' | Time: ' + Math.floor(report.totalTime / 60) + 'm ' + (report.totalTime % 60) + 's', 20, y);
    y += 12;

    doc.setFontSize(14);
    doc.text('Strengths', 20, y);
    y += 8;
    doc.setFontSize(10);
    (report.strengths || []).forEach(s => {
      doc.text('+ ' + s, 25, y);
      y += 6;
    });
    y += 6;

    doc.setFontSize(14);
    doc.text('Areas to Improve', 20, y);
    y += 8;
    doc.setFontSize(10);
    (report.improvements || []).forEach(s => {
      doc.text('- ' + s, 25, y);
      y += 6;
    });
    y += 6;

    if (report.scoreBreakdown && report.scoreBreakdown.length > 0) {
      doc.setFontSize(14);
      doc.text('Question Scores', 20, y);
      y += 8;
      doc.setFontSize(9);
      report.scoreBreakdown.forEach((q, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const text = 'Q' + (i + 1) + ' (' + q.score + '/10): ' + (q.questionText || '').slice(0, 70);
        doc.text(text, 25, y);
        y += 6;
      });
    }

    doc.save('mock-interview-report.pdf');
  };

  // Reset
  const handleReset = () => {
    if (serviceRef.current) serviceRef.current.reset();
    stopListening();
    clearTimer();
    setPhase('setup');
    setSetupStep(1);
    setInterviewMode(null);
    setSelectedRole(null);
    setCurrentQuestion(null);
    setUserAnswer('');
    setEvaluation(null);
    setShowEvaluation(false);
    setReport(null);
  };

  // Progress info
  const progress = serviceRef.current ? serviceRef.current.getProgress() : { currentQuestion: 0, totalQuestions: 0, answeredCount: 0, averageScore: 0 };

  // Timer color
  const getTimerColor = () => {
    if (!timerActive || timeLimit === 0) return 'var(--text-secondary)';
    const pct = timer / timeLimit;
    if (pct > 0.5) return 'var(--success)';
    if (pct > 0.2) return 'var(--warning)';
    return 'var(--error)';
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + String(s).padStart(2, '0');
  };

  // ==================== RENDER ====================

  return (
    <div className="panel mock-v2-panel">
      <div className="panel-header">
        <h2>{'?? Mock Interview V2'}</h2>
        <button className="btn-icon" onClick={onClose}>{'?'}</button>
      </div>

      <div className="mock-v2-content">
        <AnimatePresence mode="wait">

          {/* ===== SETUP PHASE ===== */}
          {phase === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mock-v2-setup">

              {setupStep === 1 && (
                <div className="setup-step">
                  <h3>Choose Interview Mode</h3>
                  <div className="mode-cards">
                    <div className={'mode-card' + (interviewMode === 'custom' ? ' active' : '')} onClick={() => { setInterviewMode('custom'); setSetupStep(2); }}>
                      <span className="mode-icon">{'??'}</span>
                      <span className="mode-title">Custom (Paste JD)</span>
                      <span className="mode-desc">AI generates questions from your job description</span>
                    </div>
                    <div className={'mode-card' + (interviewMode === 'template' ? ' active' : '')} onClick={() => { setInterviewMode('template'); setSetupStep(2); }}>
                      <span className="mode-icon">{'??'}</span>
                      <span className="mode-title">Template (Pick Role)</span>
                      <span className="mode-desc">Use built-in question sets for common roles</span>
                    </div>
                  </div>
                </div>
              )}

              {setupStep === 2 && interviewMode === 'template' && (
                <div className="setup-step">
                  <h3>Select Role</h3>
                  <div className="role-grid">
                    {templates.map(t => (
                      <div key={t.id} className={'role-card' + (selectedRole === t.id ? ' active' : '')} onClick={() => setSelectedRole(t.id)}>
                        <span className="role-icon">{t.icon}</span>
                        <span className="role-name">{t.name}</span>
                        <span className="role-desc">{t.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="setup-nav">
                    <button className="btn-cancel" onClick={() => setSetupStep(1)}>{'? Back'}</button>
                    <button className="btn-save" onClick={() => setSetupStep(3)} disabled={!selectedRole}>Next {'?'}</button>
                  </div>
                </div>
              )}

              {setupStep === 2 && interviewMode === 'custom' && (
                <div className="setup-step">
                  <h3>Paste Job Description</h3>
                  <textarea className="mock-v2-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." rows={8} />
                  <div className="setup-nav">
                    <button className="btn-cancel" onClick={() => setSetupStep(1)}>{'? Back'}</button>
                    <button className="btn-save" onClick={() => setSetupStep(3)} disabled={!jobDescription.trim()}>Next {'?'}</button>
                  </div>
                </div>
              )}

              {setupStep === 3 && (
                <div className="setup-step">
                  <h3>Settings</h3>
                  <div className="settings-grid">
                    <div className="setting-group">
                      <label>Difficulty</label>
                      <div className="option-pills">
                        {DIFFICULTY_OPTIONS.map(d => (
                          <button key={d.id} className={'pill' + (difficulty === d.id ? ' active' : '')} onClick={() => setDifficulty(d.id)}>
                            {d.label}
                            <span className="pill-desc">{d.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="setting-group">
                      <label>Questions</label>
                      <div className="option-pills">
                        {QUESTION_COUNTS.map(c => (
                          <button key={c} className={'pill' + (questionCount === c ? ' active' : '')} onClick={() => setQuestionCount(c)}>{c}</button>
                        ))}
                      </div>
                    </div>
                    <div className="setting-group">
                      <label>Time Limit per Question</label>
                      <div className="option-pills">
                        {TIME_LIMITS.map(t => (
                          <button key={t.value} className={'pill' + (timeLimit === t.value ? ' active' : '')} onClick={() => setTimeLimit(t.value)}>{t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="setting-group">
                      <label>Input Mode</label>
                      <div className="option-pills">
                        <button className={'pill' + (useVoice ? ' active' : '')} onClick={() => setUseVoice(true)}>{'?? Voice'}</button>
                        <button className={'pill' + (!useVoice ? ' active' : '')} onClick={() => setUseVoice(false)}>{'?? Type'}</button>
                      </div>
                    </div>
                  </div>
                  <div className="setup-nav">
                    <button className="btn-cancel" onClick={() => setSetupStep(2)}>{'? Back'}</button>
                    <button className="btn-save btn-start" onClick={handleStartInterview}>{'?? Start Interview'}</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== GENERATING PHASE ===== */}
          {phase === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mock-v2-generating">
              <div className="generating-spinner"></div>
              <p>Generating interview questions...</p>
            </motion.div>
          )}

          {/* ===== INTERVIEW PHASE ===== */}
          {phase === 'interview' && (
            <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mock-v2-interview">

              {/* Progress bar */}
              <div className="interview-progress">
                <div className="progress-info">
                  <span>Question {progress.currentQuestion} of {progress.totalQuestions}</span>
                  {progress.averageScore > 0 && <span className="avg-score">Avg: {progress.averageScore}/10</span>}
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: ((progress.currentQuestion) / progress.totalQuestions * 100) + '%' }} transition={{ duration: 0.3 }} />
                </div>
              </div>

              {/* Timer */}
              {timeLimit > 0 && (
                <div className="interview-timer" style={{ color: getTimerColor() }}>
                  <span className="timer-icon">{'??'}</span>
                  <span className="timer-value">{formatTime(timer)}</span>
                  <div className="timer-bar">
                    <div className="timer-fill" style={{ width: (timer / timeLimit * 100) + '%', background: getTimerColor() }} />
                  </div>
                </div>
              )}

              {/* Current question */}
              {currentQuestion && !showEvaluation && (
                <div className="interview-question-card">
                  <div className="question-meta">
                    <span className={'q-type q-type-' + currentQuestion.type}>{currentQuestion.type}</span>
                    <span className={'q-diff q-diff-' + currentQuestion.difficulty}>{currentQuestion.difficulty}</span>
                  </div>
                  <p className="question-text">{currentQuestion.text}</p>
                </div>
              )}

              {/* Answer input */}
              {!showEvaluation && (
                <div className="answer-section">
                  {useVoice ? (
                    <div className="voice-input">
                      <div className={'voice-indicator' + (isListening ? ' active' : '')}>
                        <span>{isListening ? '?? Listening...' : '?? Paused'}</span>
                        {!isListening && <button className="btn-sm" onClick={startListening}>Resume</button>}
                        {isListening && <button className="btn-sm" onClick={stopListening}>Pause</button>}
                      </div>
                      <div className="voice-transcript">{userAnswer || 'Speak your answer...'}</div>
                    </div>
                  ) : (
                    <textarea className="answer-textarea" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Type your answer here..." rows={5} />
                  )}

                  <div className="answer-actions">
                    <button className="btn-save" onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || isEvaluating}>
                      {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                    <button className="btn-cancel" onClick={handleSkip}>Skip</button>
                    <button className="btn-icon btn-toggle-input" onClick={() => { setUseVoice(!useVoice); if (isListening) stopListening(); }} title={useVoice ? 'Switch to typing' : 'Switch to voice'}>
                      {useVoice ? '??' : '??'}
                    </button>
                  </div>
                </div>
              )}

              {/* Evaluation display */}
              {showEvaluation && evaluation && (
                <motion.div className="evaluation-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="eval-score-main">
                    <motion.span className="eval-score-number" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                      {evaluation.overall}
                    </motion.span>
                    <span className="eval-score-label">/10</span>
                  </div>

                  <div className="eval-breakdown">
                    {[
                      { label: 'Relevance', value: evaluation.relevance },
                      { label: 'Specificity', value: evaluation.specificity },
                      { label: 'Structure', value: evaluation.structure },
                      { label: 'Confidence', value: evaluation.confidence }
                    ].map(item => (
                      <div key={item.label} className="eval-bar-item">
                        <span className="eval-bar-label">{item.label}</span>
                        <div className="eval-bar">
                          <motion.div className="eval-bar-fill" initial={{ width: 0 }} animate={{ width: (item.value / 10 * 100) + '%' }} transition={{ duration: 0.5, delay: 0.2 }} />
                        </div>
                        <span className="eval-bar-value">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="eval-feedback">{evaluation.feedback}</p>

                  <button className="btn-save" onClick={moveToNext}>
                    {progress.currentQuestion >= progress.totalQuestions ? 'View Report' : 'Next Question ?'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== REPORT PHASE ===== */}
          {phase === 'report' && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mock-v2-report">

              {isGeneratingReport && (
                <div className="generating-spinner">
                  <p>Generating your report...</p>
                </div>
              )}

              {report && !isGeneratingReport && (
                <>
                  {/* Overall score */}
                  <div className="report-score-hero">
                    <motion.div className="score-circle" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 150 }}>
                      <span className="score-value">{report.overallScore}</span>
                      <span className="score-max">/10</span>
                    </motion.div>
                    <div className="score-meta">
                      <span>{report.totalQuestions} questions</span>
                      <span>{Math.floor(report.totalTime / 60)}m {report.totalTime % 60}s</span>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  {report.scoreBreakdown && report.scoreBreakdown.length > 0 && (
                    <div className="report-section">
                      <h4>Score Breakdown</h4>
                      <div className="score-bars">
                        {report.scoreBreakdown.map((q, i) => (
                          <div key={i} className="score-bar-row">
                            <span className="score-bar-label">Q{i + 1}</span>
                            <div className="score-bar-track">
                              <motion.div className={'score-bar-fill' + (q.score >= 7 ? ' good' : q.score >= 5 ? ' ok' : ' low')} initial={{ width: 0 }} animate={{ width: (q.score / 10 * 100) + '%' }} transition={{ duration: 0.4, delay: i * 0.05 }} />
                            </div>
                            <span className="score-bar-value">{q.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {report.strengths && report.strengths.length > 0 && (
                    <div className="report-section">
                      <h4>{'?? Strengths'}</h4>
                      <div className="badge-list">
                        {report.strengths.map((s, i) => (
                          <span key={i} className="badge badge-green">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {report.improvements && report.improvements.length > 0 && (
                    <div className="report-section">
                      <h4>{'?? Areas to Improve'}</h4>
                      <div className="badge-list">
                        {report.improvements.map((s, i) => (
                          <span key={i} className="badge badge-orange">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested answers */}
                  {report.suggestedAnswers && report.suggestedAnswers.length > 0 && (
                    <div className="report-section">
                      <h4>{'?? Suggested Better Answers'}</h4>
                      {report.suggestedAnswers.map((sa, i) => (
                        <div key={i} className="suggested-answer-card">
                          <p className="sa-question">{sa.question}</p>
                          <p className="sa-answer">{sa.suggestedAnswer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Performance trend */}
                  {sessionHistory.length > 1 && (
                    <div className="report-section">
                      <h4>{'?? Performance Trend'}</h4>
                      <div className="trend-chart">
                        {sessionHistory.slice(-10).map((s, i) => (
                          <div key={i} className="trend-bar-col">
                            <div className="trend-bar" style={{ height: (s.overallScore / 10 * 100) + '%' }} />
                            <span className="trend-label">{s.overallScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assessment */}
                  {report.assessment && (
                    <div className="report-section">
                      <h4>{'?? Assessment'}</h4>
                      <p className="assessment-text">{report.assessment}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="report-actions">
                    <button className="btn-save" onClick={handleExportPdf}>{'?? Export PDF'}</button>
                    <button className="btn-ollama" onClick={handleReset}>{'?? Try Again'}</button>
                    <button className="btn-cancel" onClick={onClose}>Close</button>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default MockInterviewV2;
