import React from 'react';

function Controls({ isListening, onToggle, onSettings, onMinimize, onClear }) {
  return (
    <div className="controls-bar" style={{ WebkitAppRegion: 'drag' }}>
      <div className="controls-left" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          className={`btn-toggle ${isListening ? 'active' : ''}`}
          onClick={onToggle}
          title={isListening ? 'Stop (Ctrl+Shift+Space)' : 'Start (Ctrl+Shift+Space)'}
        >
          {isListening ? '⏹ Stop' : '▶ Start'}
        </button>
        <button className="btn-icon" onClick={onClear} title="Clear">
          🗑
        </button>
      </div>
      <div className="controls-right" style={{ WebkitAppRegion: 'no-drag' }}>
        <button className="btn-icon" onClick={onSettings} title="Settings">
          ⚙️
        </button>
        <button className="btn-icon" onClick={onMinimize} title="Minimize">
          —
        </button>
      </div>
    </div>
  );
}

export default Controls;
