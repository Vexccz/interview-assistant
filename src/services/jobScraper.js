/**
 * LinkedIn Job Scraper Service
 * Best-effort job description parsing from LinkedIn URLs.
 * Falls back gracefully since LinkedIn blocks most scraping.
 */

export class JobScraperService {
  /**
   * Attempt to parse a LinkedIn job URL
   * @param {string} url - LinkedIn job URL
   * @returns {object|null} Parsed job data or null
   */
  static async scrapeJob(url) {
    if (!url || !url.includes('linkedin.com')) {
      return null;
    }

    try {
      // Try fetching via Electron's net module (if available)
      if (window.electronAPI?.fetchUrl) {
        const html = await window.electronAPI.fetchUrl(url);
        return JobScraperService.parseLinkedInHtml(html);
      }

      // Try direct fetch (will likely be blocked by CORS/LinkedIn)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const html = await response.text();
        return JobScraperService.parseLinkedInHtml(html);
      }

      return null;
    } catch (err) {
      console.error('Job scraping failed:', err);
      return null;
    }
  }

  /**
   * Parse LinkedIn HTML for job details
   */
  static parseLinkedInHtml(html) {
    if (!html) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Try various selectors LinkedIn uses
      const title = doc.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title, h1')?.textContent?.trim();
      const company = doc.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name, .top-card-layout__second-subline a')?.textContent?.trim();
      const description = doc.querySelector('.description__text, .job-details-jobs-unified-top-card__job-description, .show-more-less-html__markup')?.textContent?.trim();
      const location = doc.querySelector('.topcard__flavor--bullet, .job-details-jobs-unified-top-card__bullet')?.textContent?.trim();

      if (title || company || description) {
        return {
          title: title || '',
          company: company || '',
          description: description || '',
          location: location || '',
          url
        };
      }

      // Try JSON-LD structured data
      const jsonLd = doc.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        const data = JSON.parse(jsonLd.textContent);
        if (data['@type'] === 'JobPosting') {
          return {
            title: data.title || '',
            company: data.hiringOrganization?.name || '',
            description: data.description || '',
            location: data.jobLocation?.address?.addressLocality || '',
            url
          };
        }
      }

      return null;
    } catch (err) {
      console.error('HTML parsing failed:', err);
      return null;
    }
  }

  /**
   * Extract job ID from LinkedIn URL
   */
  static extractJobId(url) {
    const match = url.match(/\/jobs\/view\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Format scraped job data for display
   */
  static formatJobData(data) {
    if (!data) return '';

    let formatted = '';
    if (data.title) formatted += `Position: ${data.title}\n`;
    if (data.company) formatted += `Company: ${data.company}\n`;
    if (data.location) formatted += `Location: ${data.location}\n`;
    if (data.description) formatted += `\nDescription:\n${data.description}`;

    return formatted.trim();
  }
}

export default JobScraperService;
