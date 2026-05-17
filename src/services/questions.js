// Common interview questions bank
// 30+ questions across behavioral, technical, and general categories

export const QUESTION_BANK = [
  // Behavioral (12)
  {
    id: 1,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Tell me about a time you faced a significant challenge at work. How did you handle it?'
  },
  {
    id: 2,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Describe a situation where you had to work with a difficult team member.'
  },
  {
    id: 3,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Give me an example of a time you showed leadership.'
  },
  {
    id: 4,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Tell me about a time you failed. What did you learn from it?'
  },
  {
    id: 5,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Describe a situation where you had to meet a tight deadline.'
  },
  {
    id: 6,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Tell me about a time you had to adapt to a major change.'
  },
  {
    id: 7,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Give an example of when you went above and beyond your job responsibilities.'
  },
  {
    id: 8,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Describe a conflict you had with a coworker and how you resolved it.'
  },
  {
    id: 9,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Tell me about a time you had to persuade someone to see your point of view.'
  },
  {
    id: 10,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Describe a situation where you had to make a decision with incomplete information.'
  },
  {
    id: 11,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Tell me about your greatest professional achievement.'
  },
  {
    id: 12,
    category: 'behavioral',
    label: '🎯 Behavioral',
    question: 'Give an example of a time you received constructive criticism. How did you respond?'
  },

  // Technical (12)
  {
    id: 13,
    category: 'technical',
    label: '💻 Technical',
    question: 'Explain the difference between REST and GraphQL APIs.'
  },
  {
    id: 14,
    category: 'technical',
    label: '💻 Technical',
    question: 'How would you design a scalable system for handling millions of users?'
  },
  {
    id: 15,
    category: 'technical',
    label: '💻 Technical',
    question: 'What is your approach to debugging a complex production issue?'
  },
  {
    id: 16,
    category: 'technical',
    label: '💻 Technical',
    question: 'Explain the concept of microservices and when you would use them.'
  },
  {
    id: 17,
    category: 'technical',
    label: '💻 Technical',
    question: 'How do you ensure code quality in your projects?'
  },
  {
    id: 18,
    category: 'technical',
    label: '💻 Technical',
    question: 'Describe your experience with CI/CD pipelines.'
  },
  {
    id: 19,
    category: 'technical',
    label: '💻 Technical',
    question: 'What are the SOLID principles and why are they important?'
  },
  {
    id: 20,
    category: 'technical',
    label: '💻 Technical',
    question: 'How would you optimize a slow database query?'
  },
  {
    id: 21,
    category: 'technical',
    label: '💻 Technical',
    question: 'Explain the difference between SQL and NoSQL databases. When would you use each?'
  },
  {
    id: 22,
    category: 'technical',
    label: '💻 Technical',
    question: 'What is your experience with cloud services (AWS/Azure/GCP)?'
  },
  {
    id: 23,
    category: 'technical',
    label: '💻 Technical',
    question: 'How do you handle security in your applications?'
  },
  {
    id: 24,
    category: 'technical',
    label: '💻 Technical',
    question: 'Explain the concept of containerization and Docker.'
  },

  // General (12)
  {
    id: 25,
    category: 'general',
    label: '💬 General',
    question: 'Tell me about yourself.'
  },
  {
    id: 26,
    category: 'general',
    label: '💬 General',
    question: 'Why are you interested in this position?'
  },
  {
    id: 27,
    category: 'general',
    label: '💬 General',
    question: 'Where do you see yourself in 5 years?'
  },
  {
    id: 28,
    category: 'general',
    label: '💬 General',
    question: 'What are your greatest strengths and weaknesses?'
  },
  {
    id: 29,
    category: 'general',
    label: '💬 General',
    question: 'Why are you leaving your current job?'
  },
  {
    id: 30,
    category: 'general',
    label: '💬 General',
    question: 'What do you know about our company?'
  },
  {
    id: 31,
    category: 'general',
    label: '💬 General',
    question: 'What is your expected salary?'
  },
  {
    id: 32,
    category: 'general',
    label: '💬 General',
    question: 'Do you have any questions for us?'
  },
  {
    id: 33,
    category: 'general',
    label: '💬 General',
    question: 'How do you handle stress and pressure?'
  },
  {
    id: 34,
    category: 'general',
    label: '💬 General',
    question: 'What motivates you?'
  },
  {
    id: 35,
    category: 'general',
    label: '💬 General',
    question: 'Describe your ideal work environment.'
  },
  {
    id: 36,
    category: 'general',
    label: '💬 General',
    question: 'How do you prioritize your work when you have multiple deadlines?'
  }
];

export function getQuestionsByCategory(category) {
  if (!category || category === 'all') return QUESTION_BANK;
  return QUESTION_BANK.filter(q => q.category === category);
}
