import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: 'Welcome to InterviewAI',
    description: 'Your real-time AI interview assistant. Get smart response suggestions, live transcription, and coaching — all in a sleek overlay.',
    icon: '🎯'
  },
  {
    title: 'Configure LLM',
    description: 'Connect to your preferred AI model. Works with OpenAI, Ollama, or any OpenAI-compatible API.',
    icon: '🤖'
  },
  {
    title: 'Upload Resume',
    description: 'Paste your resume so the AI can tailor responses to your experience and skills.',
    icon: '📄'
  }
];

function Onboarding({ onComplete, initialSettings }) {
  const [step, setStep] = useState(0);
  const [llmBaseUrl, setLlmBaseUrl] = useState(initialSettings?.llmBaseUrl || 'https://api.openai.com/v1');
  const [llmApiKey, setLlmApiKey] = useState(initialSettings?.llmApiKey || '');
  const [llmModel, setLlmModel] = useState(initialSettings?.llmModel || 'gpt-4');
  const [resume, setResume] = useState(initialSettings?.resume || '');

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = () => {
    const settings = {
      llmBaseUrl,
      llmApiKey,
      llmModel,
      resume
    };
    localStorage.setItem('onboarding_complete', 'true');
    onComplete(settings);
  };

  const handleOllamaPreset = () => {
    setLlmBaseUrl('http://localhost:11434/v1');
    setLlmApiKey('');
    setLlmModel('llama3');
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_complete', 'true');
    onComplete({});
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="onboarding-step"
          >
            <div className="onboarding-icon">{steps[step].icon}</div>
            <h2 className="onboarding-title">{steps[step].title}</h2>
            <p className="onboarding-description">{steps[step].description}</p>

            {/* Step 1: Configure LLM */}
            {step === 1 && (
              <div className="onboarding-form">
                <div className="form-group">
                  <label>API Endpoint</label>
                  <input
                    type="text"
                    value={llmBaseUrl}
                    onChange={(e) => setLlmBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    placeholder="gpt-4"
                  />
                </div>
                <button className="btn-preset" onClick={handleOllamaPreset}>
                  🦙 Use Ollama (Local)
                </button>
              </div>
            )}

            {/* Step 2: Resume */}
            {step === 2 && (
              <div className="onboarding-form">
                <div className="form-group">
                  <label>Paste your resume</label>
                  <textarea
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Paste your resume text here... (skills, experience, education)"
                    rows={8}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="onboarding-nav">
          <button
            className="btn-secondary"
            onClick={step === 0 ? handleSkip : handleBack}
          >
            {step === 0 ? 'Skip' : 'Back'}
          </button>
          <button className="btn-primary" onClick={handleNext}>
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
