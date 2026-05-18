/**
 * Interview Templates Service
 * Built-in question sets for common roles, categorized by type and difficulty.
 */

export const ROLE_TEMPLATES = {
  software_engineer: {
    id: 'software_engineer',
    name: 'Software Engineer',
    icon: '💻',
    description: 'System design, coding concepts, debugging, teamwork',
    questions: [
      // Behavioral
      { text: 'Tell me about a time you had to debug a critical production issue under pressure. What was your approach?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe a situation where you disagreed with a technical decision made by your team. How did you handle it?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a project where you had to learn a new technology quickly. How did you approach it?', type: 'behavioral', difficulty: 'easy' },
      { text: 'Describe a time when you mentored a junior developer. What was the outcome?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you had to make a trade-off between code quality and delivery speed.', type: 'behavioral', difficulty: 'hard' },
      { text: 'Describe your most challenging cross-team collaboration. What made it difficult and how did you navigate it?', type: 'behavioral', difficulty: 'hard' },
      // Technical
      { text: 'Explain how you would design a URL shortening service like bit.ly. Walk me through the architecture.', type: 'technical', difficulty: 'hard' },
      { text: 'What happens when you type a URL into a browser and press Enter? Be as detailed as possible.', type: 'technical', difficulty: 'medium' },
      { text: 'How would you optimize a slow database query that joins multiple tables with millions of rows?', type: 'technical', difficulty: 'hard' },
      { text: 'Explain the difference between REST and GraphQL. When would you choose one over the other?', type: 'technical', difficulty: 'medium' },
      { text: 'How do you ensure your code is maintainable and testable? Give specific practices you follow.', type: 'technical', difficulty: 'easy' },
      { text: 'Design a rate limiter for an API. What algorithms would you consider and why?', type: 'technical', difficulty: 'hard' },
      { text: 'Explain how garbage collection works in your preferred language. What are the trade-offs?', type: 'technical', difficulty: 'medium' },
      // Situational
      { text: 'Your team is behind schedule on a critical feature. The PM wants to cut testing. What do you do?', type: 'situational', difficulty: 'medium' },
      { text: 'You discover a security vulnerability in production code written by a senior engineer. How do you handle it?', type: 'situational', difficulty: 'hard' },
      { text: 'A new requirement comes in that conflicts with the current architecture. How would you approach this?', type: 'situational', difficulty: 'medium' },
      { text: 'You join a team with no documentation and legacy code. What are your first steps?', type: 'situational', difficulty: 'easy' },
    ]
  },

  product_manager: {
    id: 'product_manager',
    name: 'Product Manager',
    icon: '📊',
    description: 'Product sense, metrics, prioritization, stakeholder management',
    questions: [
      // Behavioral
      { text: 'Tell me about a product you launched that failed. What did you learn?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe a time you had to say no to a stakeholder. How did you handle the conversation?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you used data to change the direction of a product.', type: 'behavioral', difficulty: 'hard' },
      { text: 'Describe how you handled conflicting priorities from multiple stakeholders.', type: 'behavioral', difficulty: 'hard' },
      { text: 'Tell me about a feature you championed from idea to launch. What was your process?', type: 'behavioral', difficulty: 'easy' },
      { text: 'Describe a time you had to make a decision with incomplete data. What was your framework?', type: 'behavioral', difficulty: 'hard' },
      // Technical
      { text: 'How would you measure the success of a new onboarding flow? What metrics would you track?', type: 'technical', difficulty: 'medium' },
      { text: 'Walk me through how you would prioritize a backlog of 20 features with limited engineering resources.', type: 'technical', difficulty: 'medium' },
      { text: 'How would you design an A/B test for a pricing page change? What would you measure?', type: 'technical', difficulty: 'hard' },
      { text: 'Explain your framework for writing a PRD. What sections are essential and why?', type: 'technical', difficulty: 'easy' },
      { text: 'How do you determine product-market fit? What signals do you look for?', type: 'technical', difficulty: 'hard' },
      // Situational
      { text: 'Your main competitor just launched a feature your users have been requesting. What do you do?', type: 'situational', difficulty: 'medium' },
      { text: 'Engineering says a feature will take 3 months but the CEO wants it in 1 month. How do you navigate this?', type: 'situational', difficulty: 'hard' },
      { text: 'Users are churning but you don\'t know why. Walk me through your investigation process.', type: 'situational', difficulty: 'medium' },
      { text: 'You have to choose between improving retention for existing users or acquiring new users. How do you decide?', type: 'situational', difficulty: 'hard' },
      { text: 'A key metric dropped 20% overnight. Walk me through your response.', type: 'situational', difficulty: 'medium' },
    ]
  },

  data_analyst: {
    id: 'data_analyst',
    name: 'Data Analyst',
    icon: '📈',
    description: 'SQL, statistics, data storytelling, business impact',
    questions: [
      // Behavioral
      { text: 'Tell me about a time your analysis led to a significant business decision. What was the impact?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe a situation where stakeholders disagreed with your findings. How did you handle it?', type: 'behavioral', difficulty: 'hard' },
      { text: 'Tell me about a time you found an error in data that others had been using. What did you do?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe how you communicated complex findings to a non-technical audience.', type: 'behavioral', difficulty: 'easy' },
      { text: 'Tell me about a project where you had to work with messy, incomplete data.', type: 'behavioral', difficulty: 'medium' },
      // Technical
      { text: 'Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN with examples.', type: 'technical', difficulty: 'easy' },
      { text: 'How would you detect and handle outliers in a dataset? What methods do you use?', type: 'technical', difficulty: 'medium' },
      { text: 'Write a SQL query to find the top 3 products by revenue for each category in the last 30 days.', type: 'technical', difficulty: 'medium' },
      { text: 'Explain p-values and statistical significance. When might a statistically significant result not be practically significant?', type: 'technical', difficulty: 'hard' },
      { text: 'How would you design a dashboard to track user engagement? What metrics and visualizations would you include?', type: 'technical', difficulty: 'medium' },
      { text: 'Explain the difference between correlation and causation with a real-world example.', type: 'technical', difficulty: 'easy' },
      { text: 'How would you approach building a cohort analysis? Walk me through the steps.', type: 'technical', difficulty: 'hard' },
      // Situational
      { text: 'A VP asks you to "prove" that a new feature is working. The data is ambiguous. What do you do?', type: 'situational', difficulty: 'hard' },
      { text: 'You notice a data pipeline has been producing incorrect results for 2 weeks. How do you handle this?', type: 'situational', difficulty: 'medium' },
      { text: 'Multiple teams want your help simultaneously. How do you prioritize your work?', type: 'situational', difficulty: 'easy' },
      { text: 'You\'re asked to build a predictive model but have limited historical data. What\'s your approach?', type: 'situational', difficulty: 'hard' },
    ]
  },

  marketing: {
    id: 'marketing',
    name: 'Marketing',
    icon: '📣',
    description: 'Campaign strategy, analytics, brand, growth',
    questions: [
      // Behavioral
      { text: 'Tell me about a campaign you ran that exceeded expectations. What made it successful?', type: 'behavioral', difficulty: 'easy' },
      { text: 'Describe a marketing initiative that failed. What did you learn and how did you pivot?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you had to market a product with a very limited budget.', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe how you built a brand voice from scratch. What was your process?', type: 'behavioral', difficulty: 'hard' },
      { text: 'Tell me about a time you used customer insights to change your marketing strategy.', type: 'behavioral', difficulty: 'medium' },
      // Technical
      { text: 'How do you calculate and optimize Customer Acquisition Cost (CAC)? What levers do you pull?', type: 'technical', difficulty: 'medium' },
      { text: 'Walk me through how you would set up attribution modeling for a multi-channel campaign.', type: 'technical', difficulty: 'hard' },
      { text: 'How do you measure brand awareness? What metrics and methods do you use?', type: 'technical', difficulty: 'medium' },
      { text: 'Explain your approach to SEO content strategy. How do you prioritize keywords?', type: 'technical', difficulty: 'medium' },
      { text: 'How would you design a referral program? What incentive structures work best?', type: 'technical', difficulty: 'hard' },
      // Situational
      { text: 'Your company gets negative press coverage. How do you respond from a marketing perspective?', type: 'situational', difficulty: 'hard' },
      { text: 'You need to launch a product in a market where you have zero brand recognition. What\'s your strategy?', type: 'situational', difficulty: 'hard' },
      { text: 'Your top-performing channel suddenly drops in effectiveness. What do you do?', type: 'situational', difficulty: 'medium' },
      { text: 'The CEO wants to rebrand. You disagree. How do you approach this conversation?', type: 'situational', difficulty: 'medium' },
      { text: 'You have $10K to spend on a product launch. How do you allocate it?', type: 'situational', difficulty: 'easy' },
    ]
  },

  finance: {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    description: 'Valuation, modeling, market analysis, risk',
    questions: [
      // Behavioral
      { text: 'Tell me about a financial model you built that influenced a major business decision.', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe a time you identified a financial risk that others had overlooked.', type: 'behavioral', difficulty: 'hard' },
      { text: 'Tell me about a time you had to present bad financial news to leadership. How did you handle it?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe a situation where you had to work with incomplete financial data to make a recommendation.', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you improved a financial process or reporting system.', type: 'behavioral', difficulty: 'easy' },
      // Technical
      { text: 'Walk me through a DCF valuation. What are the key assumptions and how do you validate them?', type: 'technical', difficulty: 'hard' },
      { text: 'Explain the three financial statements and how they connect to each other.', type: 'technical', difficulty: 'easy' },
      { text: 'How would you assess whether a company should take on debt vs. raise equity?', type: 'technical', difficulty: 'hard' },
      { text: 'What is WACC and how do you calculate it? What are common pitfalls?', type: 'technical', difficulty: 'medium' },
      { text: 'How do you build a sensitivity analysis? What variables do you typically stress-test?', type: 'technical', difficulty: 'medium' },
      { text: 'Explain the difference between enterprise value and equity value.', type: 'technical', difficulty: 'easy' },
      // Situational
      { text: 'A business unit is underperforming. How would you analyze whether to invest more or divest?', type: 'situational', difficulty: 'hard' },
      { text: 'The CFO asks you to cut 15% from the budget. How do you approach this?', type: 'situational', difficulty: 'medium' },
      { text: 'You find a discrepancy in the quarterly report 2 days before the board meeting. What do you do?', type: 'situational', difficulty: 'hard' },
      { text: 'A department wants to hire 10 more people. How do you evaluate the ROI of this request?', type: 'situational', difficulty: 'medium' },
      { text: 'Interest rates just rose significantly. How does this affect your company\'s financial strategy?', type: 'situational', difficulty: 'medium' },
    ]
  },

  general: {
    id: 'general',
    name: 'General',
    icon: '🎯',
    description: 'Leadership, conflict, strengths/weaknesses, career goals',
    questions: [
      // Behavioral
      { text: 'Tell me about yourself and why you\'re interested in this role.', type: 'behavioral', difficulty: 'easy' },
      { text: 'Describe a time you showed leadership without having a formal leadership title.', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a conflict with a coworker. How did you resolve it?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe your biggest professional failure. What did you learn from it?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you went above and beyond what was expected of you.', type: 'behavioral', difficulty: 'easy' },
      { text: 'Describe a situation where you had to adapt to a major change at work.', type: 'behavioral', difficulty: 'medium' },
      { text: 'Tell me about a time you received critical feedback. How did you respond?', type: 'behavioral', difficulty: 'medium' },
      { text: 'Describe your approach to managing multiple deadlines simultaneously.', type: 'behavioral', difficulty: 'easy' },
      // Technical (general skills)
      { text: 'What is your greatest professional strength? Give me a specific example of how it\'s helped you.', type: 'technical', difficulty: 'easy' },
      { text: 'How do you stay current in your field? What resources do you use?', type: 'technical', difficulty: 'easy' },
      { text: 'Describe your ideal work environment. What conditions help you do your best work?', type: 'technical', difficulty: 'easy' },
      { text: 'How do you measure your own success in a role?', type: 'technical', difficulty: 'medium' },
      // Situational
      { text: 'Where do you see yourself in 5 years? How does this role fit into that plan?', type: 'situational', difficulty: 'easy' },
      { text: 'Your manager gives you a task you think is the wrong approach. What do you do?', type: 'situational', difficulty: 'medium' },
      { text: 'You\'re assigned to a team where morale is low. How would you contribute positively?', type: 'situational', difficulty: 'medium' },
      { text: 'You realize you won\'t meet a deadline. How do you handle this?', type: 'situational', difficulty: 'easy' },
      { text: 'A colleague takes credit for your work in a meeting. How do you respond?', type: 'situational', difficulty: 'hard' },
      { text: 'You\'re offered a promotion but it means managing your current peers. How do you approach this?', type: 'situational', difficulty: 'hard' },
    ]
  }
};

/**
 * Get questions for a role filtered by type and difficulty
 */
export function getTemplateQuestions(roleId, { types, difficulty, count } = {}) {
  const template = ROLE_TEMPLATES[roleId];
  if (!template) return [];

  let questions = [...template.questions];

  if (types && types.length > 0) {
    questions = questions.filter(q => types.includes(q.type));
  }

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle
  questions = shuffleArray(questions);

  if (count) {
    questions = questions.slice(0, count);
  }

  return questions;
}

/**
 * Get a balanced mix of questions for a role
 */
export function getBalancedQuestions(roleId, { count = 10, difficulty } = {}) {
  const template = ROLE_TEMPLATES[roleId];
  if (!template) return [];

  let questions = [...template.questions];

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Target mix: 40% behavioral, 40% technical, 20% situational
  const behavioral = shuffleArray(questions.filter(q => q.type === 'behavioral'));
  const technical = shuffleArray(questions.filter(q => q.type === 'technical'));
  const situational = shuffleArray(questions.filter(q => q.type === 'situational'));

  const behavioralCount = Math.round(count * 0.4);
  const technicalCount = Math.round(count * 0.4);
  const situationalCount = count - behavioralCount - technicalCount;

  const selected = [
    ...behavioral.slice(0, behavioralCount),
    ...technical.slice(0, technicalCount),
    ...situational.slice(0, situationalCount)
  ];

  return shuffleArray(selected);
}

/**
 * Get all available role templates
 */
export function getAllTemplates() {
  return Object.values(ROLE_TEMPLATES);
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default { ROLE_TEMPLATES, getTemplateQuestions, getBalancedQuestions, getAllTemplates };
