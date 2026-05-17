/**
 * Meeting App Detection Service
 * Detects if Google Meet, Zoom, or Teams is running.
 */

export class MeetingDetectorService {
  constructor() {
    this.detectedApp = null;
    this.pollInterval = null;
    this.listeners = [];
  }

  /**
   * Start polling for meeting apps
   */
  start() {
    if (this.pollInterval) return;
    this.poll();
    this.pollInterval = setInterval(() => this.poll(), 5000);
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Poll for meeting app windows
   */
  async poll() {
    try {
      if (window.electronAPI?.getDesktopSources) {
        const sources = await window.electronAPI.getDesktopSources();
        const detected = this.detectMeetingApp(sources);

        if (detected !== this.detectedApp) {
          this.detectedApp = detected;
          this.notify();
        }
      }
    } catch (err) {
      console.error('Meeting detection error:', err);
    }
  }

  /**
   * Detect meeting app from window sources
   */
  detectMeetingApp(sources) {
    if (!sources || sources.length === 0) return null;

    const names = sources.map(s => s.name.toLowerCase());

    // Check for Google Meet
    if (names.some(n => n.includes('meet.google.com') || n.includes('google meet'))) {
      return { name: 'Google Meet', icon: '📹', id: 'google_meet' };
    }

    // Check for Zoom
    if (names.some(n => n.includes('zoom meeting') || n.includes('zoom') && n.includes('meeting'))) {
      return { name: 'Zoom', icon: '🔵', id: 'zoom' };
    }

    // Check for Microsoft Teams
    if (names.some(n => n.includes('microsoft teams') || n.includes('teams meeting') || (n.includes('teams') && n.includes('meeting')))) {
      return { name: 'Microsoft Teams', icon: '🟣', id: 'teams' };
    }

    // Check for Webex
    if (names.some(n => n.includes('webex') || n.includes('cisco webex'))) {
      return { name: 'Webex', icon: '🟢', id: 'webex' };
    }

    return null;
  }

  /**
   * Subscribe to meeting detection changes
   */
  onDetection(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notify() {
    this.listeners.forEach(cb => cb(this.detectedApp));
  }

  /**
   * Get current detected app
   */
  getDetected() {
    return this.detectedApp;
  }
}

export default MeetingDetectorService;
