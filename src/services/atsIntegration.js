// ATS Integration Service
// Pull job details from ATS platforms (Greenhouse, Lever, Workday)
// Supports API key auth + URL scraping fallback

export class ATSIntegrationService {
  static SETTINGS_KEY = 'interview_ats_settings';

  static getSettings() {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    return {
      greenhouse: { apiKey: '', enabled: false },
      lever: { apiKey: '', enabled: false },
      workday: { apiKey: '', tenantUrl: '', enabled: false }
    };
  }

  static saveSettings(settings) {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Fetch jobs from Greenhouse
  static async fetchGreenhouseJobs(apiKey) {
    if (!apiKey) throw new Error('Greenhouse API key required');

    try {
      const response = await fetch('https://harvest.greenhouse.io/v1/jobs?status=open', {
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Greenhouse API error: ${response.status}`);
      
      const jobs = await response.json();
      return jobs.map(job => ({
        id: job.id,
        title: job.name,
        department: job.departments?.[0]?.name || '',
        location: job.offices?.[0]?.name || 'Remote',
        description: this._stripHtml(job.notes || ''),
        url: job.job_url || '',
        source: 'greenhouse'
      }));
    } catch (err) {
      console.error('Greenhouse fetch error:', err);
      throw err;
    }
  }

  // Fetch jobs from Lever
  static async fetchLeverJobs(apiKey) {
    if (!apiKey) throw new Error('Lever API key required');

    try {
      const response = await fetch('https://api.lever.co/v1/postings', {
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Lever API error: ${response.status}`);
      
      const data = await response.json();
      const postings = data.data || data;
      
      return (Array.isArray(postings) ? postings : []).map(job => ({
        id: job.id,
        title: job.text || job.title || '',
        department: job.categories?.department || '',
        location: job.categories?.location || 'Remote',
        description: this._stripHtml(job.descriptionPlain || job.description || ''),
        url: job.hostedUrl || job.urls?.show || '',
        requirements: job.lists?.find(l => l.text === 'Requirements')?.content || '',
        source: 'lever'
      }));
    } catch (err) {
      console.error('Lever fetch error:', err);
      throw err;
    }
  }

  // Fetch jobs from Workday
  static async fetchWorkdayJobs(apiKey, tenantUrl) {
    if (!apiKey || !tenantUrl) throw new Error('Workday API key and tenant URL required');

    try {
      const baseUrl = tenantUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/v1/jobs`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Workday API error: ${response.status}`);
      
      const data = await response.json();
      const jobs = data.jobs || data.data || [];
      
      return jobs.map(job => ({
        id: job.id || job.jobRequisitionId,
        title: job.title || job.jobPostingTitle || '',
        department: job.department || job.organizationName || '',
        location: job.location || job.primaryLocation || 'Remote',
        description: job.description || job.jobDescription || '',
        requirements: job.requirements || job.qualifications || '',
        source: 'workday'
      }));
    } catch (err) {
      console.error('Workday fetch error:', err);
      throw err;
    }
  }

  // Fetch from any configured ATS
  static async fetchAllJobs() {
    const settings = this.getSettings();
    const allJobs = [];
    const errors = [];

    if (settings.greenhouse.enabled && settings.greenhouse.apiKey) {
      try {
        const jobs = await this.fetchGreenhouseJobs(settings.greenhouse.apiKey);
        allJobs.push(...jobs);
      } catch (err) {
        errors.push({ source: 'Greenhouse', error: err.message });
      }
    }

    if (settings.lever.enabled && settings.lever.apiKey) {
      try {
        const jobs = await this.fetchLeverJobs(settings.lever.apiKey);
        allJobs.push(...jobs);
      } catch (err) {
        errors.push({ source: 'Lever', error: err.message });
      }
    }

    if (settings.workday.enabled && settings.workday.apiKey) {
      try {
        const jobs = await this.fetchWorkdayJobs(settings.workday.apiKey, settings.workday.tenantUrl);
        allJobs.push(...jobs);
      } catch (err) {
        errors.push({ source: 'Workday', error: err.message });
      }
    }

    return { jobs: allJobs, errors };
  }

  // Parse job from URL (fallback when no API access)
  static async parseJobFromUrl(url) {
    try {
      // Attempt to detect ATS from URL
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      let jobData = {
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        source: 'url',
        url
      };

      // Greenhouse board URLs
      if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse')) {
        const pathParts = parsed.pathname.split('/');
        jobData.company = pathParts[1] || '';
        // Try to fetch the public job page
        jobData = await this._fetchPublicJobPage(url, jobData);
      }
      // Lever URLs
      else if (hostname.includes('lever.co') || hostname.includes('jobs.lever')) {
        const pathParts = parsed.pathname.split('/');
        jobData.company = pathParts[1] || '';
        jobData = await this._fetchPublicJobPage(url, jobData);
      }
      // LinkedIn URLs
      else if (hostname.includes('linkedin.com')) {
        jobData = await this._fetchPublicJobPage(url, jobData);
      }
      // Generic job page
      else {
        jobData = await this._fetchPublicJobPage(url, jobData);
      }

      return jobData;
    } catch (err) {
      console.error('URL parse error:', err);
      return null;
    }
  }

  // Import a job into settings format
  static formatJobForSettings(job) {
    let description = '';
    
    if (job.title) description += `Position: ${job.title}\n`;
    if (job.company) description += `Company: ${job.company}\n`;
    if (job.department) description += `Department: ${job.department}\n`;
    if (job.location) description += `Location: ${job.location}\n`;
    if (description) description += '\n---\n\n';
    if (job.description) description += `Description:\n${job.description}\n\n`;
    if (job.requirements) description += `Requirements:\n${job.requirements}\n`;

    return {
      jobDescription: description.trim(),
      companyName: job.company || ''
    };
  }

  // Private helpers
  static async _fetchPublicJobPage(url, fallbackData) {
    try {
      // In Electron, we could use a proxy or the main process to fetch
      // For now, return the fallback with the URL noted
      // The user can paste the content manually
      return {
        ...fallbackData,
        description: `[Job URL: ${url}]\n\nPaste the job description here, or configure API keys in Settings > Integrations for automatic import.`
      };
    } catch (err) {
      return fallbackData;
    }
  }

  static _stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
