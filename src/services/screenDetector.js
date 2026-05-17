/**
 * Screen Sharing Detection Service
 * Detects when a screen share is active using Electron's desktopCapturer.
 */

export class ScreenDetectorService {
  constructor() {
    this.isScreenSharing = false;
    this.pollInterval = null;
    this.listeners = [];
  }

  /**
   * Start polling for screen share status
   */
  start() {
    if (this.pollInterval) return;
    this.poll();
    this.pollInterval = setInterval(() => this.poll(), 3000);
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
   * Poll for active screen sharing
   */
  async poll() {
    try {
      if (window.electronAPI?.getDesktopSources) {
        const sources = await window.electronAPI.getDesktopSources();
        // Check if there are active screen sources beyond the default
        // When screen sharing is active, there are typically additional screen sources
        const screenSources = sources.filter(s =>
          s.name.toLowerCase().includes('screen') ||
          s.name.toLowerCase().includes('entire screen') ||
          s.name.toLowerCase().includes('display')
        );

        // Also check for window titles that indicate screen sharing apps are sharing
        const sharingIndicators = sources.filter(s =>
          s.name.toLowerCase().includes('sharing') ||
          s.name.toLowerCase().includes('presenting') ||
          s.name.toLowerCase().includes('screen share')
        );

        const wasSharing = this.isScreenSharing;
        this.isScreenSharing = sharingIndicators.length > 0;

        if (wasSharing !== this.isScreenSharing) {
          this.notify();
        }
      } else {
        // Fallback: check if any screen capture API is active
        // This is a best-effort detection without Electron
        this.checkBrowserScreenShare();
      }
    } catch (err) {
      console.error('Screen detection error:', err);
    }
  }

  /**
   * Browser-based screen share detection fallback
   */
  checkBrowserScreenShare() {
    // Check if getDisplayMedia has been called (limited detection)
    if (navigator.mediaDevices) {
      const tracks = document.querySelectorAll('video');
      let detected = false;
      tracks.forEach(video => {
        if (video.srcObject) {
          const videoTracks = video.srcObject.getVideoTracks();
          videoTracks.forEach(track => {
            if (track.label.toLowerCase().includes('screen') || track.label.toLowerCase().includes('display')) {
              detected = true;
            }
          });
        }
      });

      if (detected !== this.isScreenSharing) {
        this.isScreenSharing = detected;
        this.notify();
      }
    }
  }

  /**
   * Subscribe to screen share changes
   * @param {Function} callback - (isSharing: boolean) => void
   */
  onStatusChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notify() {
    this.listeners.forEach(cb => cb(this.isScreenSharing));
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.isScreenSharing;
  }
}

export default ScreenDetectorService;
