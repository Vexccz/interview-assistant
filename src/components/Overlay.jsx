import React from 'react';

function Overlay({ transcript, partialTranscript, response, isListening, isGenerating }) {
  return (
    <div className="overlay">
      <div className="section">
        <div className="section-header">
          <span className="section-label">🎤 Interviewer</span>
          {isListening && <span className="listening-indicator">● LIVE</span>}
        </div>
        <div className="section-content transcript-content">
          {transcript && <span className="final-text">{transcript}</span>}
          {partialTranscript && <span className="partial-text"> {partialTranscript}</span>}
          {!transcript && !partialTranscript && (
            <span className="placeholder">
              {isListening ? 'Listening for questions...' : 'Press Ctrl+Shift+Space to start'}
            </span>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="section">
        <div className="section-header">
          <span className="section-label">💡 Suggested Response</span>
          {isGenerating && <span className="generating-indicator">generating...</span>}
        </div>
        <div className="section-content response-content">
          {response ? (
            <span className="response-text">{response}</span>
          ) : (
            <span className="placeholder">
              AI response will appear here after the interviewer finishes speaking
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overlay;
