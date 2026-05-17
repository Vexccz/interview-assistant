import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../services/i18n';

const cardVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

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
            {isListening && (
              <span className="listening-indicator">
                <span
                  style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', marginRight: 5 }}
                />
                {t('listening', language)}
              </span>
            )}
            {questionTimer > 0 && (
              <span className="timer-badge">{formatTimer(questionTimer)}</span>
            )}
          </div>
        </div>
        <div className="section-content transcript-content">
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.span
                key={transcript}
                className="final-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {transcript}
              </motion.span>
            )}
          </AnimatePresence>
          {partialTranscript && <span className="partial-text"> {partialTranscript}</span>}
          {!transcript && !partialTranscript && (
            <span className="placeholder">
              {isListening ? t('listeningPlaceholder', language) : t('startPlaceholder', language)}
            </span>
          )}
        </div>
      </div>

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
              <button
                className="btn-copy"
                onClick={handleCopy}
                title={t('copy', language)}
              >
                {copied ? t('copied', language) : t('copy', language)}
              </button>
            )}
          </div>
        </div>
        <div className="section-content response-content">
          <AnimatePresence mode="wait">
            {response ? (
              <motion.div
                key="response"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {response.split('\n').map((line, i) => (
                  <span
                    key={i}
                    className="response-text"
                    style={{ display: 'block' }}
                  >
                    {line}
                  </span>
                ))}
              </motion.div>
            ) : (
              <motion.span
                key="placeholder"
                className="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t('responsePlaceholder', language)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Paused banner */}
      <AnimatePresence>
        {mode === 'paused' && (
          <motion.div
            className="mode-banner paused-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {t('paused', language)} — Ctrl+Shift+Space to resume
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Overlay;
