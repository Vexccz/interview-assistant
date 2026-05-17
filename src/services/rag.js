/**
 * RAG (Retrieval-Augmented Generation) Service
 * Stores uploaded documents and retrieves relevant chunks for LLM context.
 */

const STORAGE_KEY = 'rag_documents';
const CHUNK_SIZE = 500; // characters per chunk

export class RAGService {
  constructor() {
    this.documents = this.loadDocuments();
  }

  loadDocuments() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveDocuments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
  }

  /**
   * Add a document to the store
   * @param {string} name - filename or label
   * @param {string} content - full text content
   */
  addDocument(name, content) {
    const chunks = this.chunkText(content);
    const doc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name,
      content,
      chunks,
      addedAt: new Date().toISOString()
    };
    this.documents.push(doc);
    this.saveDocuments();
    return doc;
  }

  /**
   * Remove a document by ID
   */
  removeDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    this.saveDocuments();
  }

  /**
   * Get all documents (metadata only)
   */
  getDocuments() {
    return this.documents.map(d => ({
      id: d.id,
      name: d.name,
      addedAt: d.addedAt,
      chunkCount: d.chunks.length,
      charCount: d.content.length
    }));
  }

  /**
   * Split text into overlapping chunks
   */
  chunkText(text) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length > CHUNK_SIZE && current.length > 0) {
        chunks.push(current.trim());
        // Keep last sentence for overlap
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }

    // Fallback: if no sentence splitting worked, chunk by character
    if (chunks.length === 0 && text.length > 0) {
      for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
      }
    }

    return chunks;
  }

  /**
   * Retrieve relevant chunks based on keyword matching
   * @param {string} query - the question or context to match against
   * @param {number} maxChunks - maximum chunks to return
   * @returns {Array<{text: string, source: string, score: number}>}
   */
  retrieveRelevant(query, maxChunks = 3) {
    if (this.documents.length === 0) return [];

    const queryWords = this.extractKeywords(query);
    if (queryWords.length === 0) return [];

    const scored = [];

    for (const doc of this.documents) {
      for (const chunk of doc.chunks) {
        const score = this.scoreChunk(chunk, queryWords);
        if (score > 0) {
          scored.push({ text: chunk, source: doc.name, score });
        }
      }
    }

    // Sort by score descending, return top N
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxChunks);
  }

  /**
   * Extract meaningful keywords from text
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
      'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
      'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
      'than', 'too', 'very', 'just', 'about', 'up', 'out', 'if', 'then',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
      'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
      'she', 'her', 'it', 'its', 'they', 'them', 'their', 'how', 'when',
      'where', 'why', 'tell', 'describe', 'explain'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Score a chunk based on keyword overlap
   */
  scoreChunk(chunk, queryWords) {
    const chunkLower = chunk.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    return score;
  }

  /**
   * Format retrieved chunks for LLM context
   */
  formatForContext(query) {
    const relevant = this.retrieveRelevant(query);
    if (relevant.length === 0) return '';

    let context = '\n\n--- Relevant Document Context ---\n';
    for (const chunk of relevant) {
      context += `[From: ${chunk.source}]\n${chunk.text}\n\n`;
    }
    context += '--- End Document Context ---\n';
    return context;
  }

  /**
   * Clear all documents
   */
  clearAll() {
    this.documents = [];
    this.saveDocuments();
  }
}

export default new RAGService();
