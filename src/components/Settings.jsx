import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getLanguages } from '../services/i18n';
import { LLMService } from '../services/llm';
import { ProfilesService } from '../services/profiles';
import { ResumeParserService } from '../services/resumeParser';
import { CompanyResearchService } from '../services/companyResearch';

function Settings({ settings, onSave, onClose, language }) {
  const [form, setForm] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('general');
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [profiles, setProfiles] = useState(ProfilesService.getProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const fileInputRef = useRef(null);

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

  // Resume file upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await ResumeParserService.parseFile(file);
      if (text) {
        handleChange('resume', text);
      }
    } catch (err) {
      console.error('Resume parse error:', err);
    }
  };

  // Company research
  const handleCompanyResearch = async () => {
    if (!form.companyName?.trim()) return;
    setIsResearching(true);
    try {
      const info = await CompanyResearchService.fetchCompanyInfo(form.companyName);
      if (info) {
        handleChange('companyInfo', info);
      }
    } catch (err) {
      console.error('Company research error:', err);
    }
    setIsResearching(false);
  };

  // Profile management
  const handleSaveProfile = () => {
    if (!newProfileName.trim()) return;
    const profile = ProfilesService.addProfile({
      name: newProfileName,
      resume: form.resume,
      jobDescription: form.jobDescription,
      companyName: form.companyName || '',
      companyInfo: form.companyInfo
    });
    setProfiles(ProfilesService.getProfiles());
    setNewProfileName('');
    handleChange('activeProfileId', profile.id);
    ProfilesService.setActiveProfileId(profile.id);
  };

  const handleLoadProfile = (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      handleChange('resume', profile.resume || '');
      handleChange('jobDescription', profile.jobDescription || '');
      handleChange('companyName', profile.companyName || '');
      handleChange('companyInfo', profile.companyInfo || '');
      handleChange('activeProfileId', profile.id);
      ProfilesService.setActiveProfileId(profile.id);
    }
  };

  const handleDeleteProfile = (profileId) => {
    ProfilesService.deleteProfile(profileId);
    setProfiles(ProfilesService.getProfiles());
    if (form.activeProfileId === profileId) {
      handleChange('activeProfileId', null);
      ProfilesService.setActiveProfileId(null);
    }
  };

  const tabs = [
    { id: 'general', label: t('tabGeneral', language) },
    { id: 'profiles', label: 'Profiles' },
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

                {/* Resume with upload */}
                <label>
                  {t('resume', language)}
                  <div className="resume-upload-row">
                    <button type="button" className="btn-ollama" onClick={() => fileInputRef.current?.click()}>
                      Upload Resume (PDF/TXT)
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      style={{ display: 'none' }}
                      onChange={handleResumeUpload}
                    />
                  </div>
                  <textarea
                    value={form.resume}
                    onChange={(e) => handleChange('resume', e.target.value)}
                    placeholder="Paste your resume here or upload a file..."
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

                {/* Company name with auto-fetch */}
                <label>
                  Company Name
                  <div className="company-research-row">
                    <input
                      type="text"
                      value={form.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="e.g. Google, Microsoft..."
                    />
                    <button
                      type="button"
                      className="btn-ollama"
                      onClick={handleCompanyResearch}
                      disabled={isResearching || !form.companyName?.trim()}
                    >
                      {isResearching ? 'Researching...' : 'Auto-fetch'}
                    </button>
                  </div>
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

          {/* Profiles Tab */}
          {activeTab === 'profiles' && (
            <motion.div key="profiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>INTERVIEW PROFILES</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Save different profiles for different job applications. Each profile stores resume, job description, and company info.
                </p>

                {/* Create new profile */}
                <div className="profile-create-row">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="New profile name..."
                  />
                  <button type="button" className="btn-ollama" onClick={handleSaveProfile} disabled={!newProfileName.trim()}>
                    Save Current as Profile
                  </button>
                </div>

                {/* Profile list */}
                <div className="profiles-list">
                  {profiles.length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No profiles saved yet.
                    </p>
                  )}
                  {profiles.map(profile => (
                    <div key={profile.id} className={`profile-item ${form.activeProfileId === profile.id ? 'active' : ''}`}>
                      <div className="profile-item-info">
                        <span className="profile-item-name">{profile.name}</span>
                        <span className="profile-item-date">{new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="profile-item-actions">
                        <button type="button" className="btn-ollama" onClick={() => handleLoadProfile(profile.id)}>
                          Load
                        </button>
                        <button type="button" className="btn-icon" onClick={() => handleDeleteProfile(profile.id)} title="Delete">
                          🗑
                        </button>
                      </div>
                    </div>
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
                <h3>NOTIFICATION SOUND</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enableNotificationSound !== false}
                    onChange={(e) => handleChange('enableNotificationSound', e.target.checked)}
                  />
                  Play chime when AI response is ready
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
