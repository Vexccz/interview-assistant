import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../services/i18n';

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  exit: { opacity: 0, y: -10, transition: { type: 'tween', duration: 0.2 } }
};

const textLineVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { type: 'tween', duration: 0.15 } }
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.03 }
  }
};

const pulseAnimation = {
  scale: [1, 1.3, 1],
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
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
      <motion.div
        className="section"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        layout
      >
        <div className="section-header">
          <span className="section-label">{t('interviewer', language)}</span>
          <div className="section-header-right">
            {questionType && (
              <span className="badge badge-type">{questionType.label}</span>
            )}
            {isListening && (
              <span className="listening-indicator">
                <motion.span
                  className="status-dot"
                  animate={pulseAnimation}
                  style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', marginRight: 6 }}
                />
                {t('listening', language)}
              </span>
            )}
            {questionTimer > 0 && (
              <span className="timer-badge">⏱ {formatTimer(questionTimer)}</span>
            )}
          </div>
        </div>
        <motion.div className="section-content transcript-content" layout>
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.span
                key={transcript}
                className="final-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
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
        </motion.div>
      </motion.div>

      <div className="divider" />

      {/* Response section */}
      <motion.div
        className="section"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        layout
      >
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
              <motion.button
                className="btn-copy"
                onClick={handleCopy}
                title={t('copy', language)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {copied ? t('copied', language) : t('copy', language)}
              </motion.button>
            )}
          </div>
        </div>
        <motion.div className="section-content response-content" layout>
          <AnimatePresence mode="wait">
            {response ? (
              <motion.div
                key="response"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {response.split('\n').map((line, i) => (
                  <motion.span
                    key={i}
                    className="response-text"
                    variants={textLineVariants}
                    style={{ display: 'block' }}
                  >
                    {line}
                  </motion.span>
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
        </motion.div>
      </motion.div>

      {/* Mode indicator at bottom */}
      <AnimatePresence>
        {mode === 'paused' && (
          <motion.div
            className="mode-banner paused-banner"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {t('paused', language)} — Ctrl+Shift+Space to resume
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Overlay;
