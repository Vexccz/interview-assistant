// Transcript service - save interview transcript to file

export class TranscriptService {
  constructor() {
    this.entries = [];
    this.startTime = null;
  }

  start() {
    this.startTime = new Date();
    this.entries = [];
  }

  addEntry(question, response, questionType) {
    this.entries.push({
      timestamp: new Date(),
      question,
      response,
      type: questionType?.label || '💬 General'
    });
  }

  generateMarkdown() {
    if (this.entries.length === 0) return '';

    const dateStr = this.startTime ? this.startTime.toLocaleDateString() : new Date().toLocaleDateString();
    const timeStr = this.startTime ? this.startTime.toLocaleTimeString() : new Date().toLocaleTimeString();

    let md = `# Interview Transcript\n`;
    md += `**Date:** ${dateStr}\n`;
    md += `**Time:** ${timeStr}\n`;
    md += `**Total Questions:** ${this.entries.length}\n\n`;
    md += `---\n\n`;

    this.entries.forEach((entry, i) => {
      const elapsed = this.startTime
        ? Math.floor((entry.timestamp - this.startTime) / 1000)
        : 0;
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;

      md += `## Q${i + 1} [${mins}:${secs.toString().padStart(2, '0')}] ${entry.type}\n\n`;
      md += `**Interviewer:** ${entry.question}\n\n`;
      md += `**Suggested Response:** ${entry.response}\n\n`;
      md += `---\n\n`;
    });

    return md;
  }

  generateText() {
    if (this.entries.length === 0) return '';

    const dateStr = this.startTime ? this.startTime.toLocaleDateString() : new Date().toLocaleDateString();
    const timeStr = this.startTime ? this.startTime.toLocaleTimeString() : new Date().toLocaleTimeString();

    let txt = `INTERVIEW TRANSCRIPT\n`;
    txt += `Date: ${dateStr}\n`;
    txt += `Time: ${timeStr}\n`;
    txt += `Total Questions: ${this.entries.length}\n`;
    txt += `${'='.repeat(50)}\n\n`;

    this.entries.forEach((entry, i) => {
      txt += `Q${i + 1} [${entry.type}]\n`;
      txt += `Interviewer: ${entry.question}\n`;
      txt += `Response: ${entry.response}\n`;
      txt += `${'-'.repeat(40)}\n\n`;
    });

    return txt;
  }

  // Download as file
  download(format = 'md') {
    const content = format === 'md' ? this.generateMarkdown() : this.generateText();
    const filename = `interview-transcript-${new Date().toISOString().slice(0, 10)}.${format}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  reset() {
    this.entries = [];
    this.startTime = null;
  }
}
