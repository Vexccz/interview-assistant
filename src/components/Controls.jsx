import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../services/i18n';

function Controls({ mode, isListening, onToggle, onCycleMode, onSettings, onMinimize, onClear, onSaveTranscript, onExportPdf, onQuestionBank, onAnalytics, onMockInterview, onHistory, language }) {
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
        <button
          className={`btn-toggle ${isListening ? 'active' : ''}`}
          onClick={onToggle}
          title={isListening ? 'Stop (Ctrl+Shift+Space)' : 'Start (Ctrl+Shift+Space)'}
        >
          {isListening ? t('stop', language) : t('start', language)}
        </button>
        {mode !== 'stopped' && (
          <span
            className={`mode-indicator mode-${mode}`}
            onClick={onCycleMode}
            title="Cycle mode (Ctrl+Shift+Space)"
          >
            {getModeLabel()}
          </span>
        )}
      </div>
      <div
        className="controls-right"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <button className="btn-icon" onClick={onClear} title={t('clear', language) + ' (Ctrl+K)'}>
          🗑
        </button>
        <button className="btn-icon" onClick={onMockInterview} title="Mock Interview (Ctrl+M)">
          🎭
        </button>
        <button className="btn-icon" onClick={onQuestionBank} title={t('questionBank', language)}>
          📋
        </button>
        <button className="btn-icon" onClick={onHistory} title="History (Ctrl+H)">
          📜
        </button>
        <button className="btn-icon" onClick={onSaveTranscript} title={t('saveTranscript', language) + ' (Ctrl+S)'}>
          💾
        </button>
        <button className="btn-icon" onClick={onExportPdf} title="Export PDF (Ctrl+E)">
          📄
        </button>
        <button className="btn-icon" onClick={onAnalytics} title={t('analytics', language)}>
          📊
        </button>
        <button className="btn-icon" onClick={onSettings} title={t('settings', language) + ' (Ctrl+,)'}>
          ⚙️
        </button>
        <button className="btn-icon" onClick={onMinimize} title={t('minimize', language)}>
          —
        </button>
      </div>
    </div>
  );
}

export default Controls;
