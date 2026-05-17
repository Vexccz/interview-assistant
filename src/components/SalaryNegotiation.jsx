import React, { useState } from 'react';
import { motion } from 'framer-motion';

function SalaryNegotiation({ settings, llmService, onClose }) {
  const [form, setForm] = useState({
    currentSalary: '',
    targetSalary: '',
    offerReceived: '',
    competingOffers: '',
    role: '',
    experience: ''
  });
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [quickResponses, setQuickResponses] = useState([]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateScripts = async () => {
    if (!llmService) return;
    setLoading(true);

    try {
      const prompt = `You are a salary negotiation expert. Generate negotiation scripts based on this situation:

Current Salary: ${form.currentSalary || 'Not disclosed'}
Target Salary: ${form.targetSalary || 'Not specified'}
Offer Received: ${form.offerReceived || 'Pending'}
Competing Offers: ${form.competingOffers || 'None'}
Role: ${form.role || 'Not specified'}
Experience: ${form.experience || 'Not specified'}

Generate negotiation scripts in EXACTLY this JSON format (no markdown):
{
  "initialCounter": "Script for making your initial counter-offer...",
  "competingOffer": "Script for leveraging a competing offer...",
  "valueProposition": "Script for emphasizing your value...",
  "walkAway": "Script for when you're willing to walk away...",
  "benefits": "Script for negotiating non-salary benefits...",
  "quickResponses": [
    {"scenario": "They say it's non-negotiable", "response": "..."},
    {"scenario": "They ask your current salary", "response": "..."},
    {"scenario": "They lowball you", "response": "..."},
    {"scenario": "They need time to think", "response": "..."},
    {"scenario": "They ask you to justify", "response": "..."}
  ],
  "tips": ["tip1", "tip2", "tip3"]
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
          max_tokens: 2000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setScripts(parsed);
          setQuickResponses(parsed.quickResponses || []);
          setActiveTab('scripts');
        }
      }
    } catch (err) {
      console.error('Script generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="panel salary-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="panel-header">
        <h2>💰 Salary Negotiation</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Setup
        </button>
        <button
          className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
          disabled={!scripts}
        >
          Scripts
        </button>
        <button
          className={`tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
          disabled={quickResponses.length === 0}
        >
          Quick Responses
        </button>
      </div>

      <div className="salary-content">
        {activeTab === 'input' && (
          <div className="salary-form">
            <label>
              Current Salary
              <input
                type="text"
                value={form.currentSalary}
                onChange={(e) => handleChange('currentSalary', e.target.value)}
                placeholder="e.g. $85,000"
              />
            </label>
            <label>
              Target Salary
              <input
                type="text"
                value={form.targetSalary}
                onChange={(e) => handleChange('targetSalary', e.target.value)}
                placeholder="e.g. $110,000"
              />
            </label>
            <label>
              Offer Received
              <input
                type="text"
                value={form.offerReceived}
                onChange={(e) => handleChange('offerReceived', e.target.value)}
                placeholder="e.g. $95,000"
              />
            </label>
            <label>
              Competing Offers
              <input
                type="text"
                value={form.competingOffers}
                onChange={(e) => handleChange('competingOffers', e.target.value)}
                placeholder="e.g. $105,000 from Company X"
              />
            </label>
            <label>
              Role
              <input
                type="text"
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </label>
            <label>
              Years of Experience
              <input
                type="text"
                value={form.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                placeholder="e.g. 5 years"
              />
            </label>

            <button
              className="btn-save"
              onClick={generateScripts}
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? 'Generating Scripts...' : '🎯 Generate Negotiation Scripts'}
            </button>
          </div>
        )}

        {activeTab === 'scripts' && scripts && (
          <div className="salary-scripts">
            <div className="script-card">
              <h4>📝 Initial Counter-Offer</h4>
              <p>{scripts.initialCounter}</p>
            </div>
            <div className="script-card">
              <h4>⚔️ Leveraging Competing Offer</h4>
              <p>{scripts.competingOffer}</p>
            </div>
            <div className="script-card">
              <h4>⭐ Value Proposition</h4>
              <p>{scripts.valueProposition}</p>
            </div>
            <div className="script-card">
              <h4>🚶 Walk Away Script</h4>
              <p>{scripts.walkAway}</p>
            </div>
            <div className="script-card">
              <h4>🎁 Non-Salary Benefits</h4>
              <p>{scripts.benefits}</p>
            </div>

            {scripts.tips && scripts.tips.length > 0 && (
              <div className="script-card tips-card">
                <h4>💡 Tips</h4>
                <ul>
                  {scripts.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quick' && quickResponses.length > 0 && (
          <div className="salary-quick">
            <p className="quick-intro">Quick responses for common negotiation scenarios:</p>
            {quickResponses.map((item, i) => (
              <div key={i} className="quick-card">
                <div className="quick-scenario">❓ {item.scenario}</div>
                <div className="quick-response">💬 {item.response}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SalaryNegotiation;
