// Interview History service
// Saves completed interview sessions (transcript + analytics + date)
// Stored in localStorage (max 50 sessions, FIFO)

const HISTORY_KEY = 'interview-history';
const MAX_SESSIONS = 50;

export class HistoryService {
  static getSessions() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static saveSessions(sessions) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
  }

  static addSession(session) {
    const sessions = HistoryService.getSessions();
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: session.duration || 0,
      totalQuestions: session.totalQuestions || 0,
      transcript: session.transcript || [],
      analytics: session.analytics || {},
      profileName: session.profileName || 'Default',
      audioBlob: null // Audio stored separately if needed
    };

    sessions.unshift(newSession); // Add to front

    // FIFO: keep max 50
    if (sessions.length > MAX_SESSIONS) {
      sessions.splice(MAX_SESSIONS);
    }

    HistoryService.saveSessions(sessions);
    return newSession;
  }

  static deleteSession(id) {
    const sessions = HistoryService.getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    HistoryService.saveSessions(filtered);
  }

  static clearAll() {
    localStorage.removeItem(HISTORY_KEY);
  }

  static getSession(id) {
    const sessions = HistoryService.getSessions();
    return sessions.find(s => s.id === id) || null;
  }
}
