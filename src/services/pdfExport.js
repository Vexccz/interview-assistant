// PDF Export service
// Generates simple PDF from transcript using jspdf

import { jsPDF } from 'jspdf';

export class PdfExportService {
  static exportTranscript(entries, metadata = {}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Transcript', margin, y);
    y += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const dateStr = metadata.date || new Date().toLocaleDateString();
    const timeStr = metadata.time || new Date().toLocaleTimeString();
    doc.text(`Date: ${dateStr} | Time: ${timeStr}`, margin, y);
    y += 5;
    if (metadata.totalQuestions) {
      doc.text(`Total Questions: ${metadata.totalQuestions} | Duration: ${metadata.duration || 'N/A'}`, margin, y);
      y += 5;
    }
    y += 5;

    // Separator
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Entries
    doc.setTextColor(0);
    entries.forEach((entry, i) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Question number and type
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const header = `Q${i + 1} - ${entry.type || 'General'}`;
      doc.text(header, margin, y);
      y += 6;

      // Speaker label
      const speakerLabel = entry.speaker ? `[${entry.speaker}] ` : '';

      // Question
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Interviewer:', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(`${speakerLabel}${entry.question}`, maxWidth);
      questionLines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 3;

      // Response
      if (entry.response) {
        doc.setFont('helvetica', 'bold');
        doc.text('Suggested Response:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const responseLines = doc.splitTextToSize(entry.response, maxWidth);
        responseLines.forEach(line => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 5;
        });
      }

      y += 8;

      // Separator between entries
      if (i < entries.length - 1) {
        doc.setDrawColor(230);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      }
    });

    // Save
    const filename = `interview-transcript-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }
}
