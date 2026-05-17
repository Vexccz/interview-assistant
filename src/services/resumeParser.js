// Resume Parser service
// Accepts PDF (via pdf.js) or TXT files
// Extracts text content for LLM context

export class ResumeParserService {
  static async parseFile(file) {
    if (!file) return '';

    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'txt') {
      return await ResumeParserService.parseTxt(file);
    } else if (extension === 'pdf') {
      return await ResumeParserService.parsePdf(file);
    }

    return '';
  }

  static async parseTxt(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  static async parsePdf(file) {
    try {
      // Load pdf.js from CDN dynamically
      if (!window.pdfjsLib) {
        await ResumeParserService.loadPdfJs();
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (err) {
      console.error('PDF parsing failed:', err);
      // Fallback: try reading as text
      try {
        return await ResumeParserService.parseTxt(file);
      } catch (e) {
        return '';
      }
    }
  }

  static loadPdfJs() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
