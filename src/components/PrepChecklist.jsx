import React, { useState } from 'react';
import { motion } from 'framer-motion';

function PrepChecklist({ settings, llmService, onClose }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobDesc, setJobDesc] = useState(settings?.jobDescription || '');
  const [company, setCompany] = useState(settings?.companyName || '');
  const [checkedItems, setCheckedItems] = useState({});

  const generateChecklist = async () => {
    if (!llmService) {
      setError('LLM not configured. Go to Settings to set up your AI model.');
      return;
    }
    if (!jobDesc.trim() && !company.trim()) {
      setError('Please enter a job description or company name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prompt = `You are an interview preparation coach. Generate a personalized interview prep checklist.

${company ? `Company: ${company}` : ''}
${jobDesc ? `Job Description: ${jobDesc.slice(0, 1000)}` : ''}
${settings?.resume ? `Candidate Resume (summary): ${settings.resume.slice(0, 500)}` : ''}

Generate a comprehensive prep checklist in EXACTLY this JSON format (no markdown, no code blocks):
{
  "researchTopics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"],
  "skillsToHighlight": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
  "questionsToPrep": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>", "<question 6>", "<question 7>", "<question 8>"],
  "questionsToAsk": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"],
  "dayOfTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
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
          temperature: 0.7,
          max_tokens: 1200
        })
      });

      if (!response.ok) throw new Error('LLM request failed');

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setChecklist(JSON.parse(jsonMatch[0]));
        setCheckedItems({});
      } else {
        throw new Error('Could not parse response');
      }
    } catch (err) {
      console.error('Checklist generation failed:', err);
      setError('Failed to generate checklist. Check your LLM settings.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (section, index) => {
    const key = `${section}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getProgress = () => {
    if (!checklist) return 0;
    const total = Object.values(checklist).flat().length;
    const checked = Object.values(checkedItems).filter(Boolean).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  const renderSection = (title, icon, items, sectionKey) => (
    <div className="prep-section">
      <h3>{icon} {title}</h3>
      <ul className="prep-list">
        {items.map((item, i) => {
          const key = `${sectionKey}-${i}`;
          return (
            <li
              key={i}
              className={`prep-item ${checkedItems[key] ? 'checked' : ''}`}
              onClick={() => toggleItem(sectionKey, i)}
            >
              <span className="prep-checkbox">
                {checkedItems[key] ? '☑' : '☐'}
              </span>
              <span className="prep-text">{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <motion.div
      className="prep-checklist"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="prep-header">
        <h2>📋 Interview Prep Checklist</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {!checklist && (
        <div className="prep-form">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Microsoft..."
            />
          </div>
          <div className="form-group">
            <label>Job Description</label>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
            />
          </div>
          {error && <p className="prep-error">{error}</p>}
          <button
            className="btn-primary"
            onClick={generateChecklist}
            disabled={loading}
          >
            {loading ? 'Generating...' : '🎯 Generate Prep Checklist'}
          </button>
        </div>
      )}

      {checklist && (
        <div className="prep-content">
          {/* Progress bar */}
          <div className="prep-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <span className="progress-text">{getProgress()}% complete</span>
          </div>

          {renderSection('Research Topics', '🔍', checklist.researchTopics, 'research')}
          {renderSection('Skills to Highlight', '⭐', checklist.skillsToHighlight, 'skills')}
          {renderSection('Questions to Prepare For', '❓', checklist.questionsToPrep, 'questions')}
          {renderSection('Questions to Ask Interviewer', '🙋', checklist.questionsToAsk, 'ask')}
          {checklist.dayOfTips && renderSection('Day-of Tips', '💡', checklist.dayOfTips, 'tips')}

          <button
            className="btn-secondary"
            onClick={() => { setChecklist(null); setCheckedItems({}); }}
            style={{ marginTop: '12px' }}
          >
            ↺ Regenerate
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default PrepChecklist;
