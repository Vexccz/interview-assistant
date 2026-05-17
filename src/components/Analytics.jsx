import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { t } from '../services/i18n';

const staggerContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1 }
  }
};

const statCardVariant = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } }
};

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const num = parseInt(value) || 0;
    const controls = animate(0, num, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [value]);

  return <>{display}</>;
}

function AnimatedBar({ targetWidth }) {
  return (
    <motion.div
      className="type-bar-fill-inner"
      initial={{ width: 0 }}
      animate={{ width: targetWidth }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.3 }}
      style={{ height: '100%', borderRadius: 'inherit', backgroundColor: 'var(--accent-color, #3b82f6)' }}
    />
  );
}

function Analytics({ analytics, onClose, language }) {
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="panel analytics-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <h2>{t('analyticsTitle', language)}</h2>
        <motion.button
          className="btn-icon"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      {analytics.totalQuestions === 0 ? (
        <div className="analytics-empty">
          <p>{t('noData', language)}</p>
        </div>
      ) : (
        <motion.div
          className="analytics-content"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Stats grid */}
          <motion.div className="stats-grid" variants={staggerContainer}>
            <motion.div className="stat-card" variants={statCardVariant}>
              <span className="stat-value">
                <AnimatedNumber value={analytics.totalQuestions} />
              </span>
              <span className="stat-label">{t('totalQuestions', language)}</span>
            </motion.div>
            <motion.div className="stat-card" variants={statCardVariant}>
              <span className="stat-value">
                <AnimatedNumber value={analytics.avgResponseTime} />{t('seconds', language)}
              </span>
              <span className="stat-label">{t('avgResponseTime', language)}</span>
            </motion.div>
            <motion.div className="stat-card" variants={statCardVariant}>
              <span className="stat-value">{formatDuration(analytics.duration)}</span>
              <span className="stat-label">{t('duration', language)}</span>
            </motion.div>
          </motion.div>

          {/* Type breakdown */}
          <motion.div className="analytics-section" variants={fadeIn}>
            <h3>{t('typeBreakdown', language)}</h3>
            <div className="type-breakdown">
              {Object.entries(analytics.typeBreakdown).map(([type, count]) => (
                <div key={type} className="type-bar">
                  <span className="type-label">{type}</span>
                  <div className="type-bar-fill" style={{ position: 'relative', width: '100%' }}>
                    <AnimatedBar targetWidth={`${(count / analytics.totalQuestions) * 100}%`} />
                    <span className="type-count">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Topics */}
          {analytics.topics.length > 0 && (
            <motion.div className="analytics-section" variants={fadeIn}>
              <h3>{t('topicsDiscussed', language)}</h3>
              <motion.div className="topics-list" variants={staggerContainer}>
                {analytics.topics.map((topic, i) => (
                  <motion.span
                    key={i}
                    className="topic-tag"
                    variants={statCardVariant}
                  >
                    {topic}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Analytics;
