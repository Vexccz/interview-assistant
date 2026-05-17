// Auto-update checker service
// Checks GitHub releases API for newer version on app start

export class UpdateCheckerService {
  constructor(repoOwner = 'Vexccz', repoName = 'interview-assistant', currentVersion = '0.2.0') {
    this.repoOwner = repoOwner;
    this.repoName = repoName;
    this.currentVersion = currentVersion;
    this.latestVersion = null;
    this.downloadUrl = null;
    this.updateAvailable = false;
  }

  async check() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) return { available: false };

      const data = await response.json();
      const latestTag = data.tag_name?.replace(/^v/, '') || '';

      if (latestTag && this.isNewer(latestTag, this.currentVersion)) {
        this.latestVersion = latestTag;
        this.downloadUrl = data.html_url;
        this.updateAvailable = true;
        return {
          available: true,
          version: latestTag,
          url: data.html_url,
          notes: data.body || ''
        };
      }

      return { available: false };
    } catch (err) {
      console.error('Update check failed:', err);
      return { available: false };
    }
  }

  isNewer(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }
}
