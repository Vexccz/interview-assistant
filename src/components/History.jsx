import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryService } from '../services/history';
import { PdfExportService } from '../services/pdfExport';
import { t } from '../services/i18n';

function History({ onClose, language }) {
  const [sessions, setSessions] = useState(HistoryService.getSessions());
  const [selectedSession, setSelectedSession] = useState(null);

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDelete = (id) => {
    HistoryService.deleteSession(id);
    setSessions(HistoryService.getSessions());
    if (selectedSession?.id === id) setSelectedSession(null);
  };

  const handleExportPdf = (session) => {
    if (!session.transcript || session.transcript.length === 0) return;
    PdfExportService.exportTranscript(session.transcript, {
      date: new Date(session.date).toLocaleDateString(),
      time: new Date(session.date).toLocaleTimeString(),
      totalQuestions: session.totalQuestions,
      duration: formatDuration(session.duration)
    });
  };

  const handleClearAll = () => {
    HistoryService.clearAll();
    setSessions([]);
    setSelectedSession(null);
  };

  if (selectedSession) {
    return (
      <div className="panel history-panel">
        <div className="panel-header">
          <h2>Session Details</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-practice" style={{ opacity: 1 }} onClick={() => handleExportPdf(selectedSession)}>
              Export PDF
            </button>
            <button className="btn-icon" onClick={() => setSelectedSession(null)}>
              ←
            </button>
          </div>
        </div>

        <div className="history-detail-meta">
          <span>{formatDate(selectedSession.date)}</span>
          <span>{selectedSession.totalQuestions} questions</span>
          <span>{formatDuration(selectedSession.duration)}</span>
          <span>{selectedSession.profileName}</span>
        </div>

        <div className="history-transcript-list">
          {selectedSession.transcript && selectedSession.transcript.map((entry, i) => (
            <div key={i} className="history-transcript-item">
              <div className="history-q-header">
                <span className="question-category-badge">{entry.type || 'General'}</span>
                <span className="history-q-num">Q{i + 1}</span>
              </div>
              <div className="history-q-text">{entry.question}</div>
              {entry.response && (
                <div className="history-a-text">{entry.response}</div>
              )}
            </div>
          ))}
          {(!selectedSession.transcript || selectedSession.transcript.length === 0) && (
            <div className="analytics-empty">
              <p>No transcript data for this session.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="panel history-panel">
      <div className="panel-header">
        <h2>Interview History</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {sessions.length > 0 && (
            <button className="btn-practice" style={{ opacity: 1, color: 'var(--error)' }} onClick={handleClearAll}>
              Clear All
            </button>
          )}
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="analytics-empty">
          <p>No interview history yet. Complete an interview to see it here.</p>
        </div>
      ) : (
        <div className="history-list">
          {sessions.map(session => (
            <div
              key={session.id}
              className="history-item"
              onClick={() => setSelectedSession(session)}
            >
              <div className="history-item-left">
                <span className="history-item-date">{formatDate(session.date)}</span>
                <span className="history-item-profile">{session.profileName}</span>
              </div>
              <div className="history-item-right">
                <span className="history-item-stat">{session.totalQuestions}Q</span>
                <span className="history-item-stat">{formatDuration(session.duration)}</span>
                <button
                  className="btn-icon"
                  onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                  title="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
