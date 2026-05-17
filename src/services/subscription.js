/**
 * Subscription / Freemium Service
 * Tracks usage and manages free/pro tier limits.
 */

const STORAGE_KEY = 'interview_subscription';
const USAGE_KEY = 'interview_usage';

const FREE_TIER = {
  id: 'free',
  name: 'Free',
  interviewsPerMonth: 3,
  features: ['basic_coaching', 'question_bank', 'history']
};

const PRO_TIER = {
  id: 'pro',
  name: 'Pro',
  interviewsPerMonth: Infinity,
  features: [
    'basic_coaching', 'question_bank', 'history',
    'voice_analysis', 'eye_contact', 'personas',
    'salary_negotiation', 'analytics_dashboard',
    'screen_detection', 'meeting_detection',
    'job_scraper', 'glassdoor', 'pdf_export',
    'unlimited_interviews'
  ]
};

export class SubscriptionService {
  /**
   * Get current subscription tier
   */
  static getTier() {
    const data = SubscriptionService.getData();
    return data.tier === 'pro' ? PRO_TIER : FREE_TIER;
  }

  /**
   * Check if user is on Pro tier
   */
  static isPro() {
    const data = SubscriptionService.getData();
    return data.tier === 'pro';
  }

  /**
   * Set tier (for upgrade flow)
   */
  static setTier(tier) {
    const data = SubscriptionService.getData();
    data.tier = tier;
    data.upgradedAt = tier === 'pro' ? Date.now() : null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Get usage data for current month
   */
  static getUsage() {
    const usage = SubscriptionService.getUsageData();
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (usage.month !== currentMonth) {
      // Reset for new month
      usage.month = currentMonth;
      usage.interviewsUsed = 0;
      localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    }

    return usage;
  }

  /**
   * Record an interview session
   */
  static recordInterview() {
    const usage = SubscriptionService.getUsage();
    usage.interviewsUsed = (usage.interviewsUsed || 0) + 1;
    usage.totalInterviews = (usage.totalInterviews || 0) + 1;
    usage.lastInterviewAt = Date.now();
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    return usage;
  }

  /**
   * Check if user can start a new interview
   */
  static canStartInterview() {
    if (SubscriptionService.isPro()) return true;
    const usage = SubscriptionService.getUsage();
    return (usage.interviewsUsed || 0) < FREE_TIER.interviewsPerMonth;
  }

  /**
   * Get remaining interviews for free tier
   */
  static getRemainingInterviews() {
    if (SubscriptionService.isPro()) return Infinity;
    const usage = SubscriptionService.getUsage();
    return Math.max(0, FREE_TIER.interviewsPerMonth - (usage.interviewsUsed || 0));
  }

  /**
   * Check if a feature is available on current tier
   */
  static hasFeature(featureId) {
    const tier = SubscriptionService.getTier();
    return tier.features.includes(featureId);
  }

  /**
   * Get subscription data from localStorage
   */
  static getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { tier: 'free', upgradedAt: null };
    } catch {
      return { tier: 'free', upgradedAt: null };
    }
  }

  /**
   * Get usage data from localStorage
   */
  static getUsageData() {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    const currentMonth = new Date().toISOString().slice(0, 7);
    return {
      month: currentMonth,
      interviewsUsed: 0,
      totalInterviews: 0,
      lastInterviewAt: null
    };
  }

  /**
   * Get tier info for display
   */
  static getTierInfo() {
    const tier = SubscriptionService.getTier();
    const usage = SubscriptionService.getUsage();
    const remaining = SubscriptionService.getRemainingInterviews();

    return {
      tierName: tier.name,
      tierId: tier.id,
      isPro: tier.id === 'pro',
      interviewsUsed: usage.interviewsUsed || 0,
      interviewsLimit: tier.interviewsPerMonth,
      remaining,
      totalInterviews: usage.totalInterviews || 0
    };
  }
}

export default SubscriptionService;
