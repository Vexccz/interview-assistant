import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PaymentService } from '../services/payment';
import { SubscriptionService } from '../services/subscription';

function PaymentPage({ onClose, onSuccess }) {
  const [stripeKey, setStripeKey] = useState(PaymentService.getPublishableKey());
  const [checkoutUrl, setCheckoutUrl] = useState(PaymentService.getCheckoutUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pricing = PaymentService.getPricing();
  const isPro = SubscriptionService.isPro();

  const handleSaveConfig = () => {
    PaymentService.setPublishableKey(stripeKey);
    PaymentService.setCheckoutUrl(checkoutUrl);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        // After redirect, user would come back with success
        // For demo, we'll show activate button
      } else {
        setError('Please configure a Stripe Checkout URL in settings');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePro = () => {
    SubscriptionService.setTier('pro');
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleDeactivate = () => {
    SubscriptionService.setTier('free');
    onClose();
  };

  return (
    <motion.div
      className="panel payment-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="panel-header">
        <h2>💳 Subscription</h2>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="payment-content">
        {isPro ? (
          <div className="pro-active">
            <div className="pro-badge">⚡ Pro Active</div>
            <p>You have unlimited access to all features.</p>
            <button className="btn-cancel" onClick={handleDeactivate} style={{ marginTop: '12px' }}>
              Deactivate Pro
            </button>
          </div>
        ) : (
          <>
            {/* Pricing display */}
            <div className="payment-pricing">
              <div className="price-display">
                <span className="price-amount">${pricing.monthly.price}</span>
                <span className="price-interval">/month</span>
              </div>
              <p className="price-tagline">Unlock all premium features</p>
            </div>

            {/* Features */}
            <div className="payment-features">
              <h3>What you get:</h3>
              <ul>
                {pricing.monthly.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            {/* Checkout button */}
            <div className="payment-actions">
              <button
                className="btn-upgrade"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Processing...' : `🚀 Subscribe — $${pricing.monthly.price}/mo`}
              </button>

              <button
                className="btn-simulate"
                onClick={handleActivatePro}
              >
                🧪 Activate Pro (Demo Mode)
              </button>
            </div>

            {error && <p className="payment-error">{error}</p>}

            {/* Stripe config */}
            <details className="stripe-config">
              <summary>⚙️ Stripe Configuration</summary>
              <div className="config-fields">
                <label>
                  Publishable Key
                  <input
                    type="text"
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="pk_live_..."
                  />
                </label>
                <label>
                  Checkout URL
                  <input
                    type="text"
                    value={checkoutUrl}
                    onChange={(e) => setCheckoutUrl(e.target.value)}
                    placeholder="https://checkout.stripe.com/..."
                  />
                </label>
                <button className="btn-ollama" onClick={handleSaveConfig}>
                  Save Config
                </button>
              </div>
            </details>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default PaymentPage;
