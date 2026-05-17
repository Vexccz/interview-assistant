import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TeamService } from '../services/team';

function TeamDashboard({ onClose }) {
  const [team, setTeam] = useState(TeamService.getTeam());
  const [members, setMembers] = useState(TeamService.getMembers());
  const [sharedBanks, setSharedBanks] = useState(TeamService.getSharedBanks());
  const [stats, setStats] = useState(TeamService.getAggregateStats());
  const [activeTab, setActiveTab] = useState('overview');
  const [teamName, setTeamName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [inviteEmails, setInviteEmails] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankQuestions, setNewBankQuestions] = useState('');

  const refreshData = () => {
    setTeam(TeamService.getTeam());
    setMembers(TeamService.getMembers());
    setSharedBanks(TeamService.getSharedBanks());
    setStats(TeamService.getAggregateStats());
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim() || !adminEmail.trim()) return;
    TeamService.createTeam({ name: teamName, adminEmail });
    refreshData();
  };

  const handleInvite = () => {
    if (!inviteEmails.trim()) return;
    TeamService.inviteMembers(inviteEmails);
    setInviteEmails('');
    refreshData();
  };

  const handleRemoveMember = (memberId) => {
    TeamService.removeMember(memberId);
    refreshData();
  };

  const handleAddBank = () => {
    if (!newBankName.trim()) return;
    const questions = newBankQuestions.split('\n').filter(q => q.trim());
    TeamService.addSharedBank({
      name: newBankName,
      questions,
      createdBy: team?.adminEmail || 'admin'
    });
    setNewBankName('');
    setNewBankQuestions('');
    refreshData();
  };

  const handleDeleteBank = (bankId) => {
    TeamService.deleteSharedBank(bankId);
    refreshData();
  };

  const handleDeleteTeam = () => {
    if (confirm('Delete team? This removes all team data.')) {
      TeamService.deleteTeam();
      refreshData();
    }
  };

  // No team yet - show creation form
  if (!team) {
    return (
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Create Team</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleCreateTeam} className="settings-form">
          <div className="settings-section">
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
              Create a team to share question banks and track interview performance across your organization.
            </p>
            <label>
              Team Name
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Engineering Hiring"
              />
            </label>
            <label>
              Admin Email
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@company.com"
              />
            </label>
            <button type="submit" className="btn-toggle active" style={{ marginTop: '12px' }}>
              Create Team
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Team: {team.name}</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        {['overview', 'members', 'questions', 'analytics'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="settings-form">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="settings-section">
              <h3>Team Info</h3>
              <div style={{ display: 'grid', gap: '8px', color: '#e2e8f0' }}>
                <div><strong>Name:</strong> {team.name}</div>
                <div><strong>Admin:</strong> {team.adminEmail}</div>
                <div><strong>Invite Code:</strong> <code style={{ background: '#27272a', padding: '2px 8px', borderRadius: '4px' }}>{team.inviteCode}</code></div>
                <div><strong>Created:</strong> {new Date(team.createdAt).toLocaleDateString()}</div>
                <div><strong>Members:</strong> {members.length}</div>
              </div>
              <button
                type="button"
                onClick={handleDeleteTeam}
                style={{ marginTop: '16px', background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Delete Team
              </button>
            </div>
          </motion.div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="settings-section">
              <h3>Invite Members</h3>
              <label>
                Email addresses (comma or newline separated)
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="john@company.com, jane@company.com"
                  rows={3}
                />
              </label>
              <button type="button" className="btn-toggle active" onClick={handleInvite}>
                Send Invites
              </button>
            </div>

            <div className="settings-section">
              <h3>Members ({members.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map(member => (
                  <div key={member.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#27272a', padding: '10px 14px', borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{member.email}</div>
                      <div style={{ color: '#71717a', fontSize: '12px' }}>
                        {member.role} • {member.interviewCount || 0} interviews • Avg: {member.avgScore || 0}/10
                      </div>
                    </div>
                    {member.role !== 'admin' && (
                      <button
                        className="btn-icon"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove"
                      >🗑</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Shared Questions Tab */}
        {activeTab === 'questions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="settings-section">
              <h3>Add Question Bank</h3>
              <label>
                Bank Name
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="e.g. Frontend Technical Questions"
                />
              </label>
              <label>
                Questions (one per line)
                <textarea
                  value={newBankQuestions}
                  onChange={(e) => setNewBankQuestions(e.target.value)}
                  placeholder="Tell me about a time you solved a complex bug&#10;How do you approach system design?&#10;Describe your testing strategy"
                  rows={5}
                />
              </label>
              <button type="button" className="btn-toggle active" onClick={handleAddBank}>
                Add Bank
              </button>
            </div>

            <div className="settings-section">
              <h3>Shared Banks ({sharedBanks.length})</h3>
              {sharedBanks.map(bank => (
                <div key={bank.id} style={{
                  background: '#27272a', padding: '12px', borderRadius: '8px', marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{bank.name}</div>
                      <div style={{ color: '#71717a', fontSize: '12px' }}>
                        {bank.questions.length} questions • by {bank.createdBy}
                      </div>
                    </div>
                    <button className="btn-icon" onClick={() => handleDeleteBank(bank.id)}>🗑</button>
                  </div>
                  <div style={{ marginTop: '8px', color: '#a1a1aa', fontSize: '13px' }}>
                    {bank.questions.slice(0, 3).map((q, i) => (
                      <div key={i}>• {q}</div>
                    ))}
                    {bank.questions.length > 3 && <div>... +{bank.questions.length - 3} more</div>}
                  </div>
                </div>
              ))}
              {sharedBanks.length === 0 && (
                <p style={{ color: '#71717a' }}>No shared question banks yet.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="settings-section">
              <h3>Team Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#27272a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>{stats.totalInterviews}</div>
                  <div style={{ color: '#71717a', fontSize: '12px' }}>Total Interviews</div>
                </div>
                <div style={{ background: '#27272a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>{stats.avgScore}/10</div>
                  <div style={{ color: '#71717a', fontSize: '12px' }}>Avg Score</div>
                </div>
                <div style={{ background: '#27272a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.memberCount}</div>
                  <div style={{ color: '#71717a', fontSize: '12px' }}>Members</div>
                </div>
                <div style={{ background: '#27272a', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>
                    {Math.round(stats.totalDuration / 60)}m
                  </div>
                  <div style={{ color: '#71717a', fontSize: '12px' }}>Total Practice Time</div>
                </div>
              </div>

              {stats.topPerformers.length > 0 && (
                <>
                  <h3>Top Performers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stats.topPerformers.map((member, i) => (
                      <div key={member.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#27272a', padding: '10px 14px', borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</span>
                          <span style={{ color: '#e2e8f0' }}>{member.email}</span>
                        </div>
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>{member.avgScore}/10</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TeamDashboard;
