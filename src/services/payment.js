/**
 * Payment Service (Stripe Integration)
 * Client-side only - creates Stripe Checkout sessions.
 */

const STRIPE_SCRIPT_URL = 'https://js.stripe.com/v3/';

export class PaymentService {
  static stripeInstance = null;
  static scriptLoaded = false;

  /**
   * Load Stripe.js from CDN
   */
  static async loadStripe() {
    if (PaymentService.scriptLoaded && PaymentService.stripeInstance) {
      return PaymentService.stripeInstance;
    }

    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Stripe) {
        const key = PaymentService.getPublishableKey();
        if (key) {
          PaymentService.stripeInstance = window.Stripe(key);
          PaymentService.scriptLoaded = true;
          resolve(PaymentService.stripeInstance);
        } else {
          reject(new Error('Stripe publishable key not configured'));
        }
        return;
      }

      const script = document.createElement('script');
      script.src = STRIPE_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        const key = PaymentService.getPublishableKey();
        if (key && window.Stripe) {
          PaymentService.stripeInstance = window.Stripe(key);
          PaymentService.scriptLoaded = true;
          resolve(PaymentService.stripeInstance);
        } else {
          reject(new Error('Stripe publishable key not configured'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js'));
      document.head.appendChild(script);
    });
  }

  /**
   * Get Stripe publishable key from settings
   */
  static getPublishableKey() {
    try {
      const settings = localStorage.getItem('interview-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.stripePublishableKey || '';
      }
    } catch {}
    return '';
  }

  /**
   * Set Stripe publishable key
   */
  static setPublishableKey(key) {
    try {
      const settings = localStorage.getItem('interview-settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.stripePublishableKey = key;
      localStorage.setItem('interview-settings', JSON.stringify(parsed));
      // Reset instance to use new key
      PaymentService.stripeInstance = null;
      PaymentService.scriptLoaded = false;
    } catch {}
  }

  /**
   * Redirect to Stripe Checkout
   * In a real app, this would call your backend to create a session.
   * For now, it uses a pre-configured checkout link.
   */
  static async redirectToCheckout(priceId) {
    try {
      const stripe = await PaymentService.loadStripe();

      // In production, you'd call your backend here:
      // const response = await fetch('/api/create-checkout-session', { ... });
      // const { sessionId } = await response.json();
      // await stripe.redirectToCheckout({ sessionId });

      // For now, use a payment link approach
      const checkoutUrl = PaymentService.getCheckoutUrl();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        return { success: true };
      }

      return { success: false, error: 'Checkout URL not configured' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get checkout URL from settings
   */
  static getCheckoutUrl() {
    try {
      const settings = localStorage.getItem('interview-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.stripeCheckoutUrl || '';
      }
    } catch {}
    return '';
  }

  /**
   * Set checkout URL
   */
  static setCheckoutUrl(url) {
    try {
      const settings = localStorage.getItem('interview-settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed.stripeCheckoutUrl = url;
      localStorage.setItem('interview-settings', JSON.stringify(parsed));
    } catch {}
  }

  /**
   * Simulate successful payment (for testing)
   */
  static simulateUpgrade() {
    const { SubscriptionService } = require('./subscription');
    SubscriptionService.setTier('pro');
    return true;
  }

  /**
   * Get pricing info
   */
  static getPricing() {
    return {
      monthly: {
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited interviews',
          'Voice tone analysis',
          'Eye contact coaching',
          'AI interviewer personas',
          'Salary negotiation mode',
          'Analytics dashboard',
          'Meeting app detection',
          'LinkedIn job import',
          'PDF export',
          'Priority support'
        ]
      }
    };
  }
}

export default PaymentService;
