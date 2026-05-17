// Team Service
// Manages team/organization features
// Uses localStorage (structure ready for backend later)

export class TeamService {
  static STORAGE_KEY = 'interview_team';
  static MEMBERS_KEY = 'interview_team_members';
  static SHARED_BANKS_KEY = 'interview_team_question_banks';
  static ANALYTICS_KEY = 'interview_team_analytics';

  // Create a new team
  static createTeam({ name, adminEmail }) {
    const team = {
      id: `team_${Date.now()}`,
      name,
      adminEmail,
      createdAt: new Date().toISOString(),
      inviteCode: this._generateInviteCode()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(team));
    
    // Add admin as first member
    this.addMember({ email: adminEmail, role: 'admin', name: 'Admin' });
    
    return team;
  }

  // Get current team
  static getTeam() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Delete team
  static deleteTeam() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.MEMBERS_KEY);
    localStorage.removeItem(this.SHARED_BANKS_KEY);
    localStorage.removeItem(this.ANALYTICS_KEY);
  }

  // Add a member
  static addMember({ email, role = 'member', name = '' }) {
    const members = this.getMembers();
    if (members.find(m => m.email === email)) return null;
    
    const member = {
      id: `member_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      role,
      name,
      joinedAt: new Date().toISOString(),
      interviewCount: 0,
      avgScore: 0
    };
    
    members.push(member);
    localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    return member;
  }

  // Remove a member
  static removeMember(memberId) {
    const members = this.getMembers().filter(m => m.id !== memberId);
    localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
  }

  // Get all members
  static getMembers() {
    const data = localStorage.getItem(this.MEMBERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Invite members by email list
  static inviteMembers(emailList) {
    const emails = emailList.split(/[,;\n]/).map(e => e.trim()).filter(e => e.includes('@'));
    const added = [];
    
    for (const email of emails) {
      const member = this.addMember({ email, role: 'member' });
      if (member) added.push(member);
    }
    
    return added;
  }

  // Shared question banks
  static getSharedBanks() {
    const data = localStorage.getItem(this.SHARED_BANKS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static addSharedBank({ name, questions, createdBy }) {
    const banks = this.getSharedBanks();
    const bank = {
      id: `bank_${Date.now()}`,
      name,
      questions: questions || [],
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    banks.push(bank);
    localStorage.setItem(this.SHARED_BANKS_KEY, JSON.stringify(banks));
    return bank;
  }

  static updateSharedBank(bankId, updates) {
    const banks = this.getSharedBanks();
    const idx = banks.findIndex(b => b.id === bankId);
    if (idx === -1) return null;
    
    banks[idx] = { ...banks[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.SHARED_BANKS_KEY, JSON.stringify(banks));
    return banks[idx];
  }

  static deleteSharedBank(bankId) {
    const banks = this.getSharedBanks().filter(b => b.id !== bankId);
    localStorage.setItem(this.SHARED_BANKS_KEY, JSON.stringify(banks));
  }

  // Team analytics
  static recordMemberInterview(memberId, { score, duration, questionsCount }) {
    const analytics = this.getTeamAnalytics();
    const entry = {
      memberId,
      score,
      duration,
      questionsCount,
      date: new Date().toISOString()
    };
    analytics.push(entry);
    localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));

    // Update member stats
    const members = this.getMembers();
    const member = members.find(m => m.id === memberId);
    if (member) {
      member.interviewCount = (member.interviewCount || 0) + 1;
      const memberEntries = analytics.filter(a => a.memberId === memberId);
      member.avgScore = Math.round(
        memberEntries.reduce((sum, e) => sum + (e.score || 0), 0) / memberEntries.length
      );
      localStorage.setItem(this.MEMBERS_KEY, JSON.stringify(members));
    }
  }

  static getTeamAnalytics() {
    const data = localStorage.getItem(this.ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getAggregateStats() {
    const analytics = this.getTeamAnalytics();
    const members = this.getMembers();
    
    if (analytics.length === 0) {
      return {
        totalInterviews: 0,
        avgScore: 0,
        totalDuration: 0,
        memberCount: members.length,
        topPerformers: []
      };
    }

    const totalInterviews = analytics.length;
    const avgScore = Math.round(
      analytics.reduce((sum, e) => sum + (e.score || 0), 0) / totalInterviews
    );
    const totalDuration = analytics.reduce((sum, e) => sum + (e.duration || 0), 0);

    // Top performers
    const topPerformers = [...members]
      .filter(m => m.interviewCount > 0)
      .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
      .slice(0, 5);

    return {
      totalInterviews,
      avgScore,
      totalDuration,
      memberCount: members.length,
      topPerformers
    };
  }

  static _generateInviteCode() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  }
}
