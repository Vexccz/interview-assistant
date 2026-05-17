/**
 * Eye Contact Coach Service
 * Uses webcam to detect if user is looking away from camera for too long.
 * Simple heuristic: detect face position using canvas analysis.
 */

export class EyeContactService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
    this.lookAwayStart = null;
    this.lookAwayThreshold = 5000; // 5 seconds
    this.checkInterval = null;
    this.listeners = [];
    this.lastFacePosition = null;
  }

  /**
   * Start webcam and face tracking
   */
  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });

      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', '');
      await this.video.play();

      this.canvas = document.createElement('canvas');
      this.canvas.width = 320;
      this.canvas.height = 240;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

      this.isActive = true;
      this.lookAwayStart = null;

      // Check every 500ms
      this.checkInterval = setInterval(() => this.analyze(), 500);

      return true;
    } catch (err) {
      console.error('Eye contact service failed to start:', err);
      return false;
    }
  }

  /**
   * Stop webcam and tracking
   */
  stop() {
    this.isActive = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.lookAwayStart = null;
    this.lastFacePosition = null;
  }

  /**
   * Analyze current frame for face position
   */
  analyze() {
    if (!this.isActive || !this.video || !this.ctx) return;

    this.ctx.drawImage(this.video, 0, 0, 320, 240);
    const imageData = this.ctx.getImageData(0, 0, 320, 240);
    const facePosition = this.detectFacePosition(imageData);

    this.lastFacePosition = facePosition;

    if (facePosition) {
      const isLookingAway = this.isLookingAway(facePosition);

      if (isLookingAway) {
        if (!this.lookAwayStart) {
          this.lookAwayStart = Date.now();
        } else if (Date.now() - this.lookAwayStart > this.lookAwayThreshold) {
          this.notify({ type: 'look_away', message: 'Look at camera 👀' });
        }
      } else {
        if (this.lookAwayStart && Date.now() - this.lookAwayStart > this.lookAwayThreshold) {
          this.notify({ type: 'recovered', message: null });
        }
        this.lookAwayStart = null;
      }
    }
  }

  /**
   * Simple face detection using skin color heuristic
   * Returns approximate face center position or null
   */
  detectFacePosition(imageData) {
    const { data, width, height } = imageData;
    let skinPixelX = 0;
    let skinPixelY = 0;
    let skinCount = 0;

    // Sample every 4th pixel for performance
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Simple skin color detection (works for various skin tones)
        if (this.isSkinColor(r, g, b)) {
          skinPixelX += x;
          skinPixelY += y;
          skinCount++;
        }
      }
    }

    if (skinCount < 50) return null; // No face detected

    return {
      x: skinPixelX / skinCount / width, // Normalized 0-1
      y: skinPixelY / skinCount / height, // Normalized 0-1
      confidence: Math.min(skinCount / 200, 1)
    };
  }

  /**
   * Check if RGB values match skin color range
   */
  isSkinColor(r, g, b) {
    // YCbCr-based skin detection
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.169 * r - 0.331 * g + 0.500 * b;
    const cr = 128 + 0.500 * r - 0.419 * g - 0.081 * b;

    return (y > 80 && cb > 85 && cb < 135 && cr > 135 && cr < 180);
  }

  /**
   * Determine if face position indicates looking away
   * If face center is in lower third or far to sides, user is looking away
   */
  isLookingAway(position) {
    if (!position || position.confidence < 0.3) return false;

    // Face in lower third = looking down
    if (position.y > 0.7) return true;

    // Face far to the sides = looking sideways
    if (position.x < 0.2 || position.x > 0.8) return true;

    return false;
  }

  /**
   * Subscribe to eye contact events
   */
  onEvent(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  notify(event) {
    this.listeners.forEach(cb => cb(event));
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      isLookingAway: this.lookAwayStart !== null && Date.now() - this.lookAwayStart > this.lookAwayThreshold,
      faceDetected: this.lastFacePosition !== null
    };
  }
}

export default EyeContactService;
