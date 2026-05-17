import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HistoryService } from '../services/history';

function UsageDashboard({ onClose }) {
  const [sessions, setSessions] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'week' | 'month' | 'all'
  const canvasRef = useRef(null);

  useEffect(() => {
    const allSessions = HistoryService.getSessions ? HistoryService.getSessions() : [];
    setSessions(allSessions);
  }, []);

  useEffect(() => {
    if (canvasRef.current && sessions.length > 0) {
      drawScoreChart();
    }
  }, [sessions, timeRange]);

  const getFilteredSessions = () => {
    const now = Date.now();
    return sessions.filter(s => {
      if (timeRange === 'week') return now - new Date(s.date).getTime() < 7 * 24 * 60 * 60 * 1000;
      if (timeRange === 'month') return now - new Date(s.date).getTime() < 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  };

  const getStats = () => {
    const filtered = getFilteredSessions();
    if (filtered.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        totalQuestions: 0,
        totalTime: 0,
        improvement: 0,
        sessionsPerWeek: 0,
        strongestArea: 'N/A',
        weakestArea: 'N/A'
      };
    }

    const scores = filtered
      .map(s => s.analytics?.averageScore || s.analytics?.totalQuestions || 0)
      .filter(s => s > 0);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const totalQuestions = filtered.reduce((sum, s) => sum + (s.analytics?.totalQuestions || s.transcript?.length || 0), 0);
    const totalTime = filtered.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Calculate improvement (compare first half to second half)
    let improvement = 0;
    if (scores.length >= 4) {
      const mid = Math.floor(scores.length / 2);
      const firstHalf = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
      const secondHalf = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid);
      improvement = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    }

    // Sessions per week
    const oldestSession = Math.min(...filtered.map(s => new Date(s.date).getTime()));
    const weeks = Math.max(1, (Date.now() - oldestSession) / (7 * 24 * 60 * 60 * 1000));
    const sessionsPerWeek = Math.round((filtered.length / weeks) * 10) / 10;

    // Question type analysis
    const typeCounts = {};
    filtered.forEach(s => {
      if (s.transcript) {
        s.transcript.forEach(entry => {
          const type = entry.type || 'General';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });

    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const strongestArea = sortedTypes[0]?.[0] || 'N/A';
    const weakestArea = sortedTypes[sortedTypes.length - 1]?.[0] || 'N/A';

    return {
      totalSessions: filtered.length,
      avgScore: Math.round(avgScore * 10) / 10,
      totalQuestions,
      totalTime: Math.round(totalTime / 60), // minutes
      improvement,
      sessionsPerWeek,
      strongestArea,
      weakestArea
    };
  };

  const drawScoreChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = width / 2;
    const h = height / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const filtered = getFilteredSessions();
    if (filtered.length < 2) {
      ctx.fillStyle = '#71717a';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Need at least 2 sessions for chart', w / 2, h / 2);
      return;
    }

    const scores = filtered.map(s => s.analytics?.totalQuestions || s.transcript?.length || 0);
    const maxScore = Math.max(...scores, 1);
    const padding = { top: 20, right: 20, bottom: 30, left: 35 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Draw grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#71717a';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxScore - (maxScore / 4) * i), padding.left - 5, y + 3);
    }

    // Draw line
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const points = scores.map((score, i) => ({
      x: padding.left + (chartW / (scores.length - 1)) * i,
      y: padding.top + chartH - (score / maxScore) * chartH
    }));

    points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.lineTo(points[0].x, h - padding.bottom);
    ctx.closePath();
    ctx.fill();

    // Draw dots
    points.forEach(point => {
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis label
    ctx.fillStyle = '#71717a';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Sessions →', w / 2, h - 5);
  };

  const stats = getStats();

  return (
    <motion.div
      className="panel dashboard-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="panel-header">
        <h2>📈 Usage Dashboard</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      {/* Time range filter */}
      <div className="dashboard-filters">
        <button className={`filter-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Week</button>
        <button className={`filter-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Month</button>
        <button className={`filter-btn ${timeRange === 'all' ? 'active' : ''}`} onClick={() => setTimeRange('all')}>All Time</button>
      </div>

      <div className="dashboard-content">
        {/* Stats grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.totalSessions}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalQuestions}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalTime}m</span>
            <span className="stat-label">Practice Time</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.sessionsPerWeek}/wk</span>
            <span className="stat-label">Frequency</span>
          </div>
        </div>

        {/* Improvement indicator */}
        {stats.improvement !== 0 && (
          <div className={`improvement-badge ${stats.improvement > 0 ? 'positive' : 'negative'}`}>
            {stats.improvement > 0 ? '📈' : '📉'} {stats.improvement > 0 ? '+' : ''}{stats.improvement}% improvement
          </div>
        )}

        {/* Score trend chart */}
        <div className="chart-container">
          <h3>Questions per Session</h3>
          <canvas ref={canvasRef} className="score-chart" />
        </div>

        {/* Areas */}
        <div className="areas-section">
          <div className="area-card strong">
            <span className="area-icon">💪</span>
            <div>
              <span className="area-label">Most Practiced</span>
              <span className="area-value">{stats.strongestArea}</span>
            </div>
          </div>
          <div className="area-card weak">
            <span className="area-icon">🎯</span>
            <div>
              <span className="area-label">Least Practiced</span>
              <span className="area-value">{stats.weakestArea}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default UsageDashboard;
