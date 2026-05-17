import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../services/i18n';

const buttonHover = { scale: 1.05 };
const buttonTap = { scale: 0.95 };
const springTransition = { type: 'spring', stiffness: 400, damping: 25 };

const iconStagger = {
  animate: {
    transition: { staggerChildren: 0.05 }
  }
};

const iconChild = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

function Controls({ mode, isListening, onToggle, onCycleMode, onSettings, onMinimize, onClear, onSaveTranscript, onQuestionBank, onAnalytics, language }) {
  const getModeLabel = () => {
    switch (mode) {
      case 'listening': return t('listening', language);
      case 'paused': return t('paused', language);
      case 'hidden': return t('hidden', language);
      default: return '';
    }
  };

  return (
    <div className="controls-bar" style={{ WebkitAppRegion: 'drag' }}>
      <div className="controls-left" style={{ WebkitAppRegion: 'no-drag' }}>
        <span className="app-title">InterviewAI</span>
        <motion.button
          className={`btn-toggle ${isListening ? 'active' : ''}`}
          onClick={onToggle}
          title={isListening ? 'Stop (Ctrl+Shift+Space)' : 'Start (Ctrl+Shift+Space)'}
          whileHover={buttonHover}
          whileTap={buttonTap}
          animate={{
            scale: isListening ? [1, 1.03, 1] : 1,
          }}
          transition={isListening ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : springTransition}
        >
          {isListening ? t('stop', language) : t('start', language)}
        </motion.button>
        {mode !== 'stopped' && (
          <motion.span
            className={`mode-indicator mode-${mode}`}
            onClick={onCycleMode}
            title="Cycle mode (Ctrl+Shift+Space)"
            layoutId="mode-indicator"
            transition={springTransition}
          >
            {getModeLabel()}
          </motion.span>
        )}
      </div>
      <motion.div
        className="controls-right"
        style={{ WebkitAppRegion: 'no-drag' }}
        variants={iconStagger}
        initial="initial"
        animate="animate"
      >
        <motion.button className="btn-icon" onClick={onClear} title={t('clear', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          🗑
        </motion.button>
        <motion.button className="btn-icon" onClick={onQuestionBank} title={t('questionBank', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          📋
        </motion.button>
        <motion.button className="btn-icon" onClick={onSaveTranscript} title={t('saveTranscript', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          💾
        </motion.button>
        <motion.button className="btn-icon" onClick={onAnalytics} title={t('analytics', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          📊
        </motion.button>
        <motion.button className="btn-icon" onClick={onSettings} title={t('settings', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          ⚙️
        </motion.button>
        <motion.button className="btn-icon" onClick={onMinimize} title={t('minimize', language)} variants={iconChild} whileHover={buttonHover} whileTap={buttonTap} transition={springTransition}>
          —
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Controls;
