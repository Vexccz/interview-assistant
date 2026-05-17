import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getLanguages } from '../services/i18n';
import { LLMService } from '../services/llm';

function Settings({ settings, onSave, onClose, language }) {
  const [form, setForm] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('general');
  const [ollamaStatus, setOllamaStatus] = useState(null);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  useEffect(() => {
    const checkOllama = async () => {
      const llm = new LLMService({});
      const status = await llm.checkOllama();
      setOllamaStatus(status);
    };
    checkOllama();
  }, []);

  const handleOllamaPreset = () => {
    handleChange('llmBaseUrl', 'http://localhost:11434/v1');
    handleChange('llmApiKey', '');
    if (ollamaStatus?.models?.length > 0) {
      handleChange('llmModel', ollamaStatus.models[0].name);
    }
  };

  const tabs = [
    { id: 'general', label: t('tabGeneral', language) },
    { id: 'audio', label: t('tabAudio', language) },
    { id: 'ai', label: t('tabAI', language) },
    { id: 'display', label: t('tabDisplay', language) }
  ];

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>{t('settings', language)}</h2>
        <button className="btn-icon" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <AnimatePresence mode="wait">
          {/* General Tab */}
          {activeTab === 'general' && (
            <motion.div key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>{t('llmConfig', language)}</h3>
                <label>
                  {t('apiBaseUrl', language)}
                  <input
                    type="text"
                    value={form.llmBaseUrl}
                    onChange={(e) => handleChange('llmBaseUrl', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label>
                  {t('apiKey', language)}
                  <input
                    type="password"
                    value={form.llmApiKey}
                    onChange={(e) => handleChange('llmApiKey', e.target.value)}
                    placeholder="sk-... (leave empty for local models)"
                  />
                </label>
                <label>
                  {t('model', language)}
                  <input
                    type="text"
                    value={form.llmModel}
                    onChange={(e) => handleChange('llmModel', e.target.value)}
                    placeholder="gpt-4"
                  />
                </label>

                <div className="ollama-section">
                  <button type="button" className="btn-ollama" onClick={handleOllamaPreset}>
                    {t('ollamaPreset', language)}
                  </button>
                  <span className={`ollama-status ${ollamaStatus?.available ? 'available' : 'unavailable'}`}>
                    {ollamaStatus?.available ? t('ollamaDetected', language) : t('ollamaNotFound', language)}
                  </span>
                  {ollamaStatus?.available && ollamaStatus.models.length > 0 && (
                    <select
                      className="ollama-models"
                      value={form.llmModel}
                      onChange={(e) => handleChange('llmModel', e.target.value)}
                    >
                      {ollamaStatus.models.map(m => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('interviewContext', language)}</h3>
                <label>
                  {t('resume', language)}
                  <textarea
                    value={form.resume}
                    onChange={(e) => handleChange('resume', e.target.value)}
                    placeholder="Paste your resume here..."
                    rows={4}
                  />
                </label>
                <label>
                  {t('jobDescription', language)}
                  <textarea
                    value={form.jobDescription}
                    onChange={(e) => handleChange('jobDescription', e.target.value)}
                    placeholder="Paste the job description..."
                    rows={4}
                  />
                </label>
                <label>
                  {t('companyInfo', language)}
                  <textarea
                    value={form.companyInfo}
                    onChange={(e) => handleChange('companyInfo', e.target.value)}
                    placeholder="Company name, culture, what they do..."
                    rows={3}
                  />
                </label>
              </div>

              <div className="settings-section">
                <h3>{t('language', language)}</h3>
                <div className="radio-group">
                  {getLanguages().map(lang => (
                    <label key={lang.code} className="radio-label">
                      <input
                        type="radio"
                        name="language"
                        value={lang.code}
                        checked={form.language === lang.code}
                        onChange={(e) => handleChange('language', e.target.value)}
                      />
                      {lang.label}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>{t('audioSource', language)}</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audioMode"
                      value="mic"
                      checked={form.audioMode === 'mic'}
                      onChange={(e) => handleChange('audioMode', e.target.value)}
                    />
                    {t('micOnly', language)}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audioMode"
                      value="system"
                      checked={form.audioMode === 'system'}
                      onChange={(e) => handleChange('audioMode', e.target.value)}
                    />
                    {t('systemOnly', language)}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="audioMode"
                      value="both"
                      checked={form.audioMode === 'both'}
                      onChange={(e) => handleChange('audioMode', e.target.value)}
                    />
                    {t('both', language)}
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('noiseCancellation', language)}</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enableNoiseGate}
                    onChange={(e) => handleChange('enableNoiseGate', e.target.checked)}
                  />
                  {t('enableNoiseGate', language)}
                </label>
              </div>

              <div className="settings-section">
                <h3>{t('sttEngine', language)}</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.useDeepgram}
                    onChange={(e) => handleChange('useDeepgram', e.target.checked)}
                  />
                  {t('useDeepgram', language)}
                </label>
                {form.useDeepgram && (
                  <label>
                    {t('deepgramKey', language)}
                    <input
                      type="password"
                      value={form.deepgramApiKey}
                      onChange={(e) => handleChange('deepgramApiKey', e.target.value)}
                      placeholder="Deepgram API key"
                    />
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>{t('responseMode', language)}</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="responseMode"
                      value="concise"
                      checked={form.responseMode === 'concise'}
                      onChange={(e) => handleChange('responseMode', e.target.value)}
                    />
                    {t('concise', language)}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="responseMode"
                      value="detailed"
                      checked={form.responseMode === 'detailed'}
                      onChange={(e) => handleChange('responseMode', e.target.value)}
                    />
                    {t('detailed', language)}
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('starMethod', language)}</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.useStar}
                    onChange={(e) => handleChange('useStar', e.target.checked)}
                  />
                  {t('enableStar', language)}
                </label>
              </div>

              <div className="settings-section">
                <h3>{t('bulletMode', language)}</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.bulletMode}
                    onChange={(e) => handleChange('bulletMode', e.target.checked)}
                  />
                  {t('enableBullets', language)}
                </label>
              </div>
            </motion.div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>{t('fontSize', language)}</h3>
                <div className="slider-group">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={form.fontSize}
                    onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                  />
                  <span className="slider-value">{form.fontSize}px</span>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('opacity', language)}</h3>
                <div className="slider-group">
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={Math.round(form.opacity * 100)}
                    onChange={(e) => handleChange('opacity', parseInt(e.target.value) / 100)}
                  />
                  <span className="slider-value">{Math.round(form.opacity * 100)}%</span>
                </div>
              </div>

              <div className="settings-section">
                <h3>{t('theme', language)}</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={form.theme === 'dark'}
                      onChange={(e) => handleChange('theme', e.target.value)}
                    />
                    {t('dark', language)}
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={form.theme === 'light'}
                      onChange={(e) => handleChange('theme', e.target.value)}
                    />
                    {t('light', language)}
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="settings-actions">
          <button type="submit" className="btn-save">
            {t('save', language)}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose}>
            {t('cancel', language)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
