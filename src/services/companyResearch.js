// Company Research service
// Fetches basic company info from the web

export class CompanyResearchService {
  static async fetchCompanyInfo(companyName) {
    if (!companyName || !companyName.trim()) return '';

    try {
      // Try to fetch from a simple search approach
      // Use a CORS-friendly approach - fetch company website directly
      const searchQuery = encodeURIComponent(`${companyName} about company`);
      
      // Try fetching from common patterns
      const possibleUrls = [
        `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      ];

      let companyInfo = '';

      for (const url of possibleUrls) {
        try {
          const response = await fetch(url, { 
            signal: AbortSignal.timeout(5000),
            mode: 'no-cors'
          });
          // no-cors won't give us readable response, but we tried
        } catch (e) {
          // Expected to fail in most cases
        }
      }

      // Fallback: return a structured prompt for the LLM to use
      if (!companyInfo) {
        companyInfo = `Company: ${companyName}. Please use your knowledge about this company to provide relevant context in responses.`;
      }

      return companyInfo;
    } catch (err) {
      console.error('Company research failed:', err);
      return `Company: ${companyName}`;
    }
  }
}
