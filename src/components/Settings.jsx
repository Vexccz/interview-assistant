import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, getLanguages } from '../services/i18n';
import { LLMService } from '../services/llm';
import { ProfilesService } from '../services/profiles';
import { ResumeParserService } from '../services/resumeParser';
import { CompanyResearchService } from '../services/companyResearch';
import { SubscriptionService } from '../services/subscription';
import { JobScraperService } from '../services/jobScraper';
import { FineTuningService } from '../services/fineTuning';
import { ATSIntegrationService } from '../services/atsIntegration';
import { ComplianceService } from '../services/compliance';
import { TeamService } from '../services/team';

function Settings({ settings, onSave, onClose, language }) {
  const [form, setForm] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('general');
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [profiles, setProfiles] = useState(ProfilesService.getProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const fileInputRef = useRef(null);

  const tierInfo = SubscriptionService.getTierInfo();

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

  // LinkedIn job scraping
  const handleLinkedInScrape = async () => {
    if (!linkedinUrl.trim()) return;
    setScrapeStatus('loading');
    try {
      const data = await JobScraperService.scrapeJob(linkedinUrl);
      if (data) {
        if (data.title) handleChange('jobDescription', `${data.title}\n\n${data.description}`);
        if (data.company) handleChange('companyName', data.company);
        setScrapeStatus('success');
      } else {
        setScrapeStatus('failed');
      }
    } catch (err) {
      setScrapeStatus('failed');
    }
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

  // Fine-tuning state
  const [ftStats, setFtStats] = useState(FineTuningService.getTrainingStats());
  const [ftExportStatus, setFtExportStatus] = useState(null);
  const [ftProvider, setFtProvider] = useState('openai');

  // ATS state
  const [atsSettings, setAtsSettings] = useState(ATSIntegrationService.getSettings());
  const [atsJobs, setAtsJobs] = useState([]);
  const [atsFetching, setAtsFetching] = useState(false);
  const [atsJobUrl, setAtsJobUrl] = useState('');

  // Compliance state
  const [complianceSettings, setComplianceSettings] = useState(ComplianceService.getSettings());

  const handleExportTrainingData = () => {
    const result = FineTuningService.exportTrainingData({ format: ftProvider });
    setFtExportStatus(result);
    setFtStats(FineTuningService.getTrainingStats());
  };

  const handleSaveAtsSettings = () => {
    ATSIntegrationService.saveSettings(atsSettings);
  };

  const handleFetchAtsJobs = async () => {
    setAtsFetching(true);
    try {
      const result = await ATSIntegrationService.fetchAllJobs();
      setAtsJobs(result.jobs);
    } catch (e) {}
    setAtsFetching(false);
  };

  const handleImportAtsJob = (job) => {
    const formatted = ATSIntegrationService.formatJobForSettings(job);
    handleChange('jobDescription', formatted.jobDescription);
    if (formatted.companyName) handleChange('companyName', formatted.companyName);
  };

  const handleParseJobUrl = async () => {
    if (!atsJobUrl.trim()) return;
    setAtsFetching(true);
    try {
      const job = await ATSIntegrationService.parseJobFromUrl(atsJobUrl);
      if (job) {
        const formatted = ATSIntegrationService.formatJobForSettings(job);
        handleChange('jobDescription', formatted.jobDescription);
        if (formatted.companyName) handleChange('companyName', formatted.companyName);
      }
    } catch (e) {}
    setAtsFetching(false);
  };

  const handleSaveCompliance = (updates) => {
    const newSettings = { ...complianceSettings, ...updates };
    setComplianceSettings(newSettings);
    ComplianceService.saveSettings(newSettings);
  };

  const tabs = [
    { id: 'general', label: t('tabGeneral', language) },
    { id: 'profiles', label: 'Profiles' },
    { id: 'audio', label: t('tabAudio', language) },
    { id: 'ai', label: t('tabAI', language) },
    { id: 'display', label: t('tabDisplay', language) },
    { id: 'jobimport', label: 'Job Import' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'livehints', label: 'Live Suggestions' },
    { id: 'subscription', label: 'Subscription' }
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
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sttEngine"
                      value="webspeech"
                      checked={!form.useDeepgram && !form.useWhisperOffline}
                      onChange={() => { handleChange('useDeepgram', false); handleChange('useWhisperOffline', false); }}
                    />
                    Web Speech API (Free, built-in)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sttEngine"
                      value="deepgram"
                      checked={form.useDeepgram}
                      onChange={() => { handleChange('useDeepgram', true); handleChange('useWhisperOffline', false); }}
                    />
                    Deepgram (Cloud, requires API key)
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sttEngine"
                      value="whisper"
                      checked={form.useWhisperOffline}
                      onChange={() => { handleChange('useDeepgram', false); handleChange('useWhisperOffline', true); }}
                    />
                    Whisper (Offline, no internet needed)
                  </label>
                </div>
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
                {form.useWhisperOffline && (
                  <div style={{ marginTop: '8px', padding: '10px', background: '#27272a', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>Uses Whisper Tiny model via transformers.js</p>
                    <p style={{ fontSize: '12px', color: '#71717a' }}>Model downloads on first use (~40MB). Runs entirely offline after that.</p>
                  </div>
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

              <div className="settings-section">
                <h3>CUSTOM MODEL</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Use a fine-tuned model for personalized responses.
                </p>
                <label>
                  Custom Model ID
                  <input
                    type="text"
                    value={form.customModelId || ''}
                    onChange={(e) => handleChange('customModelId', e.target.value)}
                    placeholder="ft:gpt-4o-mini:org:model-id"
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.useCustomModel || false}
                    onChange={(e) => handleChange('useCustomModel', e.target.checked)}
                  />
                  Use custom model instead of default
                </label>
                {form.useCustomModel && form.customModelId && (
                  <p style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>
                    ✓ Using: {form.customModelId}
                  </p>
                )}
              </div>

              <div className="settings-section">
                <h3>FINE-TUNING</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Export your interview Q&A history as training data for fine-tuning.
                </p>
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{ftStats.totalPairs}</div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>Q&A Pairs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: ftStats.readyForFineTuning ? '#4ade80' : '#f59e0b' }}>
                        {ftStats.readyForFineTuning ? '✓' : '✗'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>Ready (min 10)</div>
                    </div>
                  </div>
                </div>
                <label>
                  Export Format
                  <select
                    value={ftProvider}
                    onChange={(e) => setFtProvider(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e2e8f0' }}
                  >
                    <option value="openai">OpenAI (JSONL)</option>
                    <option value="together">Together.ai</option>
                    <option value="alpaca">Alpaca Format</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="btn-ollama"
                  onClick={handleExportTrainingData}
                  disabled={!ftStats.readyForFineTuning}
                  style={{ marginTop: '8px' }}
                >
                  Export Training Data ({ftStats.totalPairs} pairs)
                </button>
                {ftExportStatus && (
                  <p style={{ fontSize: '12px', color: ftExportStatus.success ? '#4ade80' : '#f87171', marginTop: '8px' }}>
                    {ftExportStatus.success ? `✓ Exported ${ftExportStatus.count} pairs as ${ftExportStatus.filename}` : ftExportStatus.error}
                  </p>
                )}
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ cursor: 'pointer', color: '#818cf8', fontSize: '12px' }}>How to fine-tune</summary>
                  <div style={{ marginTop: '8px', padding: '10px', background: '#1e1b4b', borderRadius: '6px', fontSize: '12px', color: '#c7d2fe', lineHeight: '1.6' }}>
                    {FineTuningService.getInstructions(ftProvider).steps.map((step, i) => (
                      <div key={i}>{step}</div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="settings-section">
                <h3>COACHING FEATURES</h3>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enableCoaching !== false}
                    onChange={(e) => handleChange('enableCoaching', e.target.checked)}
                  />
                  Real-time speaking coach
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enableEyeContact || false}
                    onChange={(e) => handleChange('enableEyeContact', e.target.checked)}
                  />
                  Eye contact coach (webcam)
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.enableVoiceAnalysis || false}
                    onChange={(e) => handleChange('enableVoiceAnalysis', e.target.checked)}
                  />
                  Voice tone analysis
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

          {/* Job Import Tab */}
          {activeTab === 'jobimport' && (
            <motion.div key="jobimport" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>🔗 LINKEDIN JOB IMPORT</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Paste a LinkedIn job URL to auto-fill job description and company info.
                  Note: LinkedIn may block scraping. If it fails, paste the description manually.
                </p>
                <label>
                  LinkedIn Job URL
                  <div className="company-research-row">
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => { setLinkedinUrl(e.target.value); setScrapeStatus(null); }}
                      placeholder="https://www.linkedin.com/jobs/view/..."
                    />
                    <button
                      type="button"
                      className="btn-ollama"
                      onClick={handleLinkedInScrape}
                      disabled={!linkedinUrl.trim() || scrapeStatus === 'loading'}
                    >
                      {scrapeStatus === 'loading' ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </label>
                {scrapeStatus === 'success' && (
                  <p style={{ fontSize: '12px', color: '#4ade80', marginTop: '8px' }}>
                    ✓ Job data imported! Check General tab for details.
                  </p>
                )}
                {scrapeStatus === 'failed' && (
                  <p style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>
                    ✗ Could not scrape this URL. LinkedIn may be blocking the request. Please paste the job description manually.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Integrations Tab (ATS) */}
          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>🏢 ATS INTEGRATIONS</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Connect to your ATS to auto-import job descriptions and requirements.
                </p>

                {/* Greenhouse */}
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={atsSettings.greenhouse?.enabled || false}
                      onChange={(e) => setAtsSettings(prev => ({ ...prev, greenhouse: { ...prev.greenhouse, enabled: e.target.checked } }))}
                    />
                    <strong>Greenhouse</strong>
                  </label>
                  {atsSettings.greenhouse?.enabled && (
                    <label style={{ marginTop: '8px' }}>
                      API Key (Harvest API)
                      <input
                        type="password"
                        value={atsSettings.greenhouse?.apiKey || ''}
                        onChange={(e) => setAtsSettings(prev => ({ ...prev, greenhouse: { ...prev.greenhouse, apiKey: e.target.value } }))}
                        placeholder="Greenhouse Harvest API key"
                      />
                    </label>
                  )}
                </div>

                {/* Lever */}
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={atsSettings.lever?.enabled || false}
                      onChange={(e) => setAtsSettings(prev => ({ ...prev, lever: { ...prev.lever, enabled: e.target.checked } }))}
                    />
                    <strong>Lever</strong>
                  </label>
                  {atsSettings.lever?.enabled && (
                    <label style={{ marginTop: '8px' }}>
                      API Key
                      <input
                        type="password"
                        value={atsSettings.lever?.apiKey || ''}
                        onChange={(e) => setAtsSettings(prev => ({ ...prev, lever: { ...prev.lever, apiKey: e.target.value } }))}
                        placeholder="Lever API key"
                      />
                    </label>
                  )}
                </div>

                {/* Workday */}
                <div style={{ background: '#27272a', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={atsSettings.workday?.enabled || false}
                      onChange={(e) => setAtsSettings(prev => ({ ...prev, workday: { ...prev.workday, enabled: e.target.checked } }))}
                    />
                    <strong>Workday</strong>
                  </label>
                  {atsSettings.workday?.enabled && (
                    <>
                      <label style={{ marginTop: '8px' }}>
                        Tenant URL
                        <input
                          type="text"
                          value={atsSettings.workday?.tenantUrl || ''}
                          onChange={(e) => setAtsSettings(prev => ({ ...prev, workday: { ...prev.workday, tenantUrl: e.target.value } }))}
                          placeholder="https://your-company.workday.com"
                        />
                      </label>
                      <label style={{ marginTop: '8px' }}>
                        API Key
                        <input
                          type="password"
                          value={atsSettings.workday?.apiKey || ''}
                          onChange={(e) => setAtsSettings(prev => ({ ...prev, workday: { ...prev.workday, apiKey: e.target.value } }))}
                          placeholder="Workday API key"
                        />
                      </label>
                    </>
                  )}
                </div>

                <button type="button" className="btn-ollama" onClick={handleSaveAtsSettings} style={{ marginBottom: '12px' }}>
                  Save ATS Settings
                </button>
                <button type="button" className="btn-toggle active" onClick={handleFetchAtsJobs} disabled={atsFetching}>
                  {atsFetching ? 'Fetching...' : 'Fetch Jobs'}
                </button>

                {atsJobs.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Available Jobs ({atsJobs.length})</h4>
                    {atsJobs.slice(0, 10).map((job, i) => (
                      <div key={i} style={{ background: '#18181b', padding: '10px', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '13px' }}>{job.title}</div>
                          <div style={{ color: '#71717a', fontSize: '11px' }}>{job.department} • {job.location} • {job.source}</div>
                        </div>
                        <button type="button" className="btn-ollama" onClick={() => handleImportAtsJob(job)}>Import</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="settings-section">
                <h3>🔗 IMPORT FROM URL</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Paste any job posting URL to attempt extraction.
                </p>
                <div className="company-research-row">
                  <input
                    type="text"
                    value={atsJobUrl}
                    onChange={(e) => setAtsJobUrl(e.target.value)}
                    placeholder="https://boards.greenhouse.io/company/jobs/123"
                  />
                  <button type="button" className="btn-ollama" onClick={handleParseJobUrl} disabled={atsFetching || !atsJobUrl.trim()}>
                    Extract
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <motion.div key="compliance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>📋 RECORDING COMPLIANCE</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Configure consent notices shown when recording starts.
                </p>

                <label>
                  Compliance Mode
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="complianceMode"
                        value="notify"
                        checked={complianceSettings.mode === 'notify'}
                        onChange={() => handleSaveCompliance({ mode: 'notify' })}
                      />
                      Notify only (show banner)
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="complianceMode"
                        value="acknowledge"
                        checked={complianceSettings.mode === 'acknowledge'}
                        onChange={() => handleSaveCompliance({ mode: 'acknowledge' })}
                      />
                      Require acknowledgment (must click)
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="complianceMode"
                        value="off"
                        checked={complianceSettings.mode === 'off'}
                        onChange={() => handleSaveCompliance({ mode: 'off' })}
                      />
                      Off (no consent notice)
                    </label>
                  </div>
                </label>

                <label style={{ marginTop: '12px' }}>
                  Custom Consent Text
                  <textarea
                    value={complianceSettings.customText || ''}
                    onChange={(e) => handleSaveCompliance({ customText: e.target.value })}
                    placeholder="This interview is being recorded for review purposes."
                    rows={3}
                  />
                </label>

                <label className="checkbox-label" style={{ marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={complianceSettings.prependToTranscript}
                    onChange={(e) => handleSaveCompliance({ prependToTranscript: e.target.checked })}
                  />
                  Add consent notice to saved transcripts
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={complianceSettings.showTimestamp}
                    onChange={(e) => handleSaveCompliance({ showTimestamp: e.target.checked })}
                  />
                  Include timestamp in notice
                </label>
              </div>

              <div className="settings-section">
                <h3>📜 RECORDING POLICY</h3>
                <label>
                  Policy Text (shown in consent dialog)
                  <textarea
                    value={complianceSettings.recordingPolicy || ''}
                    onChange={(e) => handleSaveCompliance({ recordingPolicy: e.target.value })}
                    placeholder="Your organization's recording policy..."
                    rows={4}
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Live Suggestions Tab */}
          {activeTab === 'livehints' && (
            <motion.div key="livehints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>⚡ LIVE SUGGESTIONS</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Get real-time talking point hints when the interviewer asks a question. Toggle with Ctrl+Shift+H.
                </p>

                <label>
                  Mode
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="liveHintsMode"
                        value="practice"
                        checked={(form.liveHintsMode || 'practice') === 'practice'}
                        onChange={(e) => handleChange('liveHintsMode', e.target.value)}
                      />
                      Practice (detailed hints with STAR prompts)
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="liveHintsMode"
                        value="live"
                        checked={form.liveHintsMode === 'live'}
                        onChange={(e) => handleChange('liveHintsMode', e.target.value)}
                      />
                      Live (minimal keywords only, 3-4 words per hint)
                    </label>
                  </div>
                </label>
              </div>

              <div className="settings-section">
                <h3>DISPLAY</h3>
                <label>
                  Hint Display Duration
                  <select
                    value={form.liveHintsDisplayDuration || 30}
                    onChange={(e) => handleChange('liveHintsDisplayDuration', parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: '4px', padding: '8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e2e8f0' }}
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </label>

                <label style={{ marginTop: '12px' }}>
                  Max Hints Per Question
                  <select
                    value={form.liveHintsMaxHints || 4}
                    onChange={(e) => handleChange('liveHintsMaxHints', parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: '4px', padding: '8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e2e8f0' }}
                  >
                    <option value={3}>3 hints</option>
                    <option value={4}>4 hints</option>
                    <option value={5}>5 hints</option>
                  </select>
                </label>

                <label style={{ marginTop: '12px' }}>
                  Opacity
                  <div className="slider-group">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={Math.round((form.liveHintsOpacity || 0.4) * 100)}
                      onChange={(e) => handleChange('liveHintsOpacity', parseInt(e.target.value) / 100)}
                    />
                    <span className="slider-value">{Math.round((form.liveHintsOpacity || 0.4) * 100)}%</span>
                  </div>
                </label>

                <label style={{ marginTop: '12px' }}>
                  Position
                  <select
                    value={form.liveHintsPosition || 'bottom-right'}
                    onChange={(e) => handleChange('liveHintsPosition', e.target.value)}
                    style={{ width: '100%', marginTop: '4px', padding: '8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e2e8f0' }}
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </label>
              </div>

              <div className="settings-section">
                <h3>SHORTCUT</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Toggle teleprompter visibility: <kbd style={{ background: '#27272a', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Ctrl+Shift+H</kbd>
                </p>
              </div>
            </motion.div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <motion.div key="subscription" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="settings-section">
                <h3>📊 USAGE</h3>
                <div className="usage-display">
                  <div className="usage-counter">
                    <span className="usage-number">{tierInfo.interviewsUsed}</span>
                    <span className="usage-separator">/</span>
                    <span className="usage-limit">{tierInfo.isPro ? '∞' : tierInfo.interviewsLimit}</span>
                    <span className="usage-label">interviews this month</span>
                  </div>
                  <div className="tier-badge-display">
                    {tierInfo.isPro ? '⚡ Pro' : '🆓 Free'}
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>💳 STRIPE CONFIG</h3>
                <label>
                  Publishable Key
                  <input
                    type="text"
                    value={form.stripePublishableKey || ''}
                    onChange={(e) => handleChange('stripePublishableKey', e.target.value)}
                    placeholder="pk_live_... or pk_test_..."
                  />
                </label>
                <label>
                  Checkout URL
                  <input
                    type="text"
                    value={form.stripeCheckoutUrl || ''}
                    onChange={(e) => handleChange('stripeCheckoutUrl', e.target.value)}
                    placeholder="https://buy.stripe.com/..."
                  />
                </label>
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
