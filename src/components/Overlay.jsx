import React, { useState } from 'react';
import { t } from '../services/i18n';

function Overlay({ transcript, partialTranscript, response, isListening, isGenerating, questionType, confidence, questionTimer, mode, language, fontSize }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const formatTimer = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="overlay" style={{ fontSize: `${fontSize}px` }}>
      {/* Question section */}
      <div className="section">
        <div className="section-header">
          <span className="section-label">{t('interviewer', language)}</span>
          <div className="section-header-right">
            {questionType && (
              <span className="badge badge-type">{questionType.label}</span>
            )}
            {isListening && <span className="listening-indicator">{t('listening', language)}</span>}
            {questionTimer > 0 && (
              <span className="timer-badge">⏱ {formatTimer(questionTimer)}</span>
            )}
          </div>
        </div>
        <div className="section-content transcript-content">
          {transcript && <span className="final-text">{transcript}</span>}
          {partialTranscript && <span className="partial-text"> {partialTranscript}</span>}
          {!transcript && !partialTranscript && (
            <span className="placeholder">
              {isListening ? t('listeningPlaceholder', language) : t('startPlaceholder', language)}
            </span>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Response section */}
      <div className="section">
        <div className="section-header">
          <span className="section-label">{t('suggestedResponse', language)}</span>
          <div className="section-header-right">
            {confidence && (
              <span className={`badge badge-confidence badge-${confidence.level}`}>
                {confidence.label}
              </span>
            )}
            {isGenerating && <span className="generating-indicator">{t('generating', language)}</span>}
            {response && !isGenerating && (
              <button className="btn-copy" onClick={handleCopy} title={t('copy', language)}>
                {copied ? t('copied', language) : t('copy', language)}
              </button>
            )}
          </div>
        </div>
        <div className="section-content response-content">
          {response ? (
            <span className="response-text">{response}</span>
          ) : (
            <span className="placeholder">
              {t('responsePlaceholder', language)}
            </span>
          )}
        </div>
      </div>

      {/* Mode indicator at bottom */}
      {mode === 'paused' && (
        <div className="mode-banner paused-banner">
          {t('paused', language)} — Ctrl+Shift+Space to resume
        </div>
      )}
    </div>
  );
}

export default Overlay;
