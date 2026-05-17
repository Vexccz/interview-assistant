// Compliance Service
// Manages recording consent notices and compliance modes
// Modes: "notify" (show banner), "acknowledge" (require click), "off"

export class ComplianceService {
  static SETTINGS_KEY = 'interview_compliance_settings';

  static DEFAULT_SETTINGS = {
    mode: 'notify', // 'notify' | 'acknowledge' | 'off'
    consentText: 'This interview is being recorded for review purposes.',
    customText: '',
    prependToTranscript: true,
    showTimestamp: true,
    recordingPolicy: ''
  };

  static getSettings() {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    if (data) {
      try {
        return { ...this.DEFAULT_SETTINGS, ...JSON.parse(data) };
      } catch (e) {}
    }
    return { ...this.DEFAULT_SETTINGS };
  }

  static saveSettings(settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Check if consent is needed before recording
  static needsConsent() {
    const settings = this.getSettings();
    return settings.mode !== 'off';
  }

  // Check if acknowledgment is required (user must click)
  static requiresAcknowledgment() {
    const settings = this.getSettings();
    return settings.mode === 'acknowledge';
  }

  // Get the consent text to display
  static getConsentText() {
    const settings = this.getSettings();
    return settings.customText || settings.consentText;
  }

  // Generate consent notice for transcript
  static getTranscriptNotice() {
    const settings = this.getSettings();
    if (!settings.prependToTranscript || settings.mode === 'off') return '';

    const text = settings.customText || settings.consentText;
    const timestamp = settings.showTimestamp 
      ? `[${new Date().toLocaleString()}] ` 
      : '';
    
    return `${timestamp}RECORDING NOTICE: ${text}\n---\n`;
  }

  // Record that consent was given
  static recordConsent() {
    const log = this.getConsentLog();
    log.push({
      timestamp: new Date().toISOString(),
      text: this.getConsentText(),
      mode: this.getSettings().mode
    });
    localStorage.setItem('interview_consent_log', JSON.stringify(log));
  }

  // Get consent log
  static getConsentLog() {
    const data = localStorage.getItem('interview_consent_log');
    return data ? JSON.parse(data) : [];
  }
}
