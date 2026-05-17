import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../services/i18n';

function Analytics({ analytics, onClose, language }) {
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="panel analytics-panel">
      <div className="panel-header">
        <h2>{t('analyticsTitle', language)}</h2>
        <button className="btn-icon" onClick={onClose}>
          ✕
        </button>
      </div>

      {analytics.totalQuestions === 0 ? (
        <div className="analytics-empty">
          <p>{t('noData', language)}</p>
        </div>
      ) : (
        <div className="analytics-content">
          {/* Stats grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{analytics.totalQuestions}</span>
              <span className="stat-label">{t('totalQuestions', language)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{analytics.avgResponseTime}{t('seconds', language)}</span>
              <span className="stat-label">{t('avgResponseTime', language)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatDuration(analytics.duration)}</span>
              <span className="stat-label">{t('duration', language)}</span>
            </div>
          </div>

          {/* Type breakdown */}
          <div className="analytics-section">
            <h3>{t('typeBreakdown', language)}</h3>
            <div className="type-breakdown">
              {Object.entries(analytics.typeBreakdown).map(([type, count]) => (
                <div key={type} className="type-bar">
                  <span className="type-label">{type}</span>
                  <div className="type-bar-fill">
                    <motion.div
                      className="type-bar-fill-inner"
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / analytics.totalQuestions) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{ height: '100%', borderRadius: 'inherit' }}
                    />
                  </div>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics */}
          {analytics.topics.length > 0 && (
            <div className="analytics-section">
              <h3>{t('topicsDiscussed', language)}</h3>
              <div className="topics-list">
                {analytics.topics.map((topic, i) => (
                  <span key={i} className="topic-tag">{topic}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Analytics;
