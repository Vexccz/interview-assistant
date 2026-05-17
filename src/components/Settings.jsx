import React, { useState } from 'react';

function Settings({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h3>LLM Configuration</h3>
          <label>
            API Base URL
            <input
              type="text"
              value={form.llmBaseUrl}
              onChange={(e) => handleChange('llmBaseUrl', e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label>
            API Key
            <input
              type="password"
              value={form.llmApiKey}
              onChange={(e) => handleChange('llmApiKey', e.target.value)}
              placeholder="sk-... (leave empty for local models)"
            />
          </label>
          <label>
            Model
            <input
              type="text"
              value={form.llmModel}
              onChange={(e) => handleChange('llmModel', e.target.value)}
              placeholder="gpt-4"
            />
          </label>
        </div>

        <div className="settings-section">
          <h3>Speech-to-Text</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.useDeepgram}
              onChange={(e) => handleChange('useDeepgram', e.target.checked)}
            />
            Use Deepgram (better accuracy, requires API key)
          </label>
          {form.useDeepgram && (
            <label>
              Deepgram API Key
              <input
                type="password"
                value={form.deepgramApiKey}
                onChange={(e) => handleChange('deepgramApiKey', e.target.value)}
                placeholder="Deepgram API key"
              />
            </label>
          )}
        </div>

        <div className="settings-section">
          <h3>Interview Context</h3>
          <label>
            Your Resume
            <textarea
              value={form.resume}
              onChange={(e) => handleChange('resume', e.target.value)}
              placeholder="Paste your resume here..."
              rows={5}
            />
          </label>
          <label>
            Job Description
            <textarea
              value={form.jobDescription}
              onChange={(e) => handleChange('jobDescription', e.target.value)}
              placeholder="Paste the job description..."
              rows={5}
            />
          </label>
          <label>
            Company Info
            <textarea
              value={form.companyInfo}
              onChange={(e) => handleChange('companyInfo', e.target.value)}
              placeholder="Company name, culture, what they do..."
              rows={3}
            />
          </label>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn-save">Save Settings</button>
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
