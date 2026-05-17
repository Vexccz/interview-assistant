import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function KeyboardShortcuts({ onClose }) {
  const shortcuts = [
    { key: 'Ctrl+Shift+Space', action: 'Cycle modes (Start → Pause → Hidden → Start)' },
    { key: 'Ctrl+/', action: 'Show/hide keyboard shortcuts' },
    { key: '?', action: 'Show/hide keyboard shortcuts' },
    { key: 'Ctrl+S', action: 'Save transcript' },
    { key: 'Ctrl+E', action: 'Export transcript as PDF' },
    { key: 'Ctrl+M', action: 'Toggle mock interview mode' },
    { key: 'Ctrl+H', action: 'View interview history' },
    { key: 'Ctrl+,', action: 'Open settings' },
    { key: 'Ctrl+K', action: 'Clear transcript' },
    { key: 'Escape', action: 'Close current panel' },
  ];

  return (
    <motion.div
      className="shortcuts-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        className="shortcuts-panel"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-item">
              <kbd className="shortcut-key">{s.key}</kbd>
              <span className="shortcut-action">{s.action}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default KeyboardShortcuts;
