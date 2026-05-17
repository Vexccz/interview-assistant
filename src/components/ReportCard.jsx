import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function ReportCard({ transcriptEntries, analytics, llmService, settings, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    if (!llmService || transcriptEntries.length === 0) {
      setReport(getFallbackReport());
      setLoading(false);
      return;
    }

    try {
      const questionsText = transcriptEntries
        .map((e, i) => `Q${i + 1}: ${e.question}\nSuggested Answer: ${e.response}`)
        .join('\n\n');

      const prompt = `You are an interview coach. Analyze this interview performance and provide a report card.

Interview Data:
- Total Questions: ${transcriptEntries.length}
- Duration: ${analytics?.duration || 'Unknown'}
${settings?.jobDescription ? `- Job Description: ${settings.jobDescription.slice(0, 200)}` : ''}

Questions & Answers:
${questionsText}

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 1-100>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "improvements": ["<area 1>", "<area 2>", "<area 3>"],
  "questionBreakdown": [
    {"question": "<short question>", "score": <1-10>, "feedback": "<one line>"}
  ],
  "summary": "<2-3 sentence overall summary>"
}`;

      const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmService.apiKey ? { 'Authorization': `Bearer ${llmService.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: llmService.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 1500
        })
      });

      if (!response.ok) throw new Error('LLM request failed');

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setReport(parsed);
      } else {
        setReport(getFallbackReport());
      }
    } catch (err) {
      console.error('Report generation failed:', err);
      setReport(getFallbackReport());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackReport = () => ({
    overallScore: Math.min(100, Math.max(30, transcriptEntries.length * 15 + 20)),
    strengths: ['Completed the interview', 'Engaged with all questions', 'Used AI assistance effectively'],
    weaknesses: ['Could not generate detailed AI analysis', 'Review answers for specificity', 'Practice more for fluency'],
    improvements: ['Practice STAR method responses', 'Research company more thoroughly', 'Prepare specific examples'],
    questionBreakdown: transcriptEntries.slice(0, 10).map((e, i) => ({
      question: e.question?.slice(0, 60) || `Question ${i + 1}`,
      score: 7,
      feedback: 'Review and refine this answer'
    })),
    summary: `You answered ${transcriptEntries.length} questions during this interview session. Keep practicing to improve your confidence and response quality.`
  });

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Work';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="report-card">
        <div className="report-loading">
          <div className="spinner-large"></div>
          <p>Generating your report card...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="report-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="report-header">
        <h2>📊 Interview Report Card</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {/* Overall Score */}
      <div className="report-score-section">
        <div className="score-circle" style={{ borderColor: getScoreColor(report.overallScore) }}>
          <span className="score-number" style={{ color: getScoreColor(report.overallScore) }}>
            {report.overallScore}
          </span>
          <span className="score-label">{getScoreLabel(report.overallScore)}</span>
        </div>
        <p className="report-summary">{report.summary}</p>
      </div>

      {/* Strengths */}
      <div className="report-section">
        <h3>💪 Strengths</h3>
        <ul className="report-list success">
          {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="report-section">
        <h3>⚠️ Areas of Concern</h3>
        <ul className="report-list warning">
          {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </div>

      {/* Improvements */}
      <div className="report-section">
        <h3>🎯 How to Improve</h3>
        <ul className="report-list info">
          {report.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
        </ul>
      </div>

      {/* Question Breakdown */}
      {report.questionBreakdown && report.questionBreakdown.length > 0 && (
        <div className="report-section">
          <h3>📝 Question Breakdown</h3>
          <div className="question-breakdown">
            {report.questionBreakdown.map((q, i) => (
              <div key={i} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-q">Q{i + 1}: {q.question}</span>
                  <span
                    className="breakdown-score"
                    style={{ color: getScoreColor(q.score * 10) }}
                  >
                    {q.score}/10
                  </span>
                </div>
                <p className="breakdown-feedback">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default ReportCard;
