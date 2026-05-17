import React from 'react';
import { motion } from 'framer-motion';
import { SubscriptionService } from '../services/subscription';
import { PaymentService } from '../services/payment';

function UpgradeModal({ onClose, onUpgrade }) {
  const tierInfo = SubscriptionService.getTierInfo();
  const pricing = PaymentService.getPricing();

  const handleUpgrade = async () => {
    const result = await PaymentService.redirectToCheckout();
    if (result.success) {
      // In a real app, webhook would confirm payment
      // For now, simulate upgrade
      SubscriptionService.setTier('pro');
      if (onUpgrade) onUpgrade();
      onClose();
    }
  };

  const handleSimulateUpgrade = () => {
    SubscriptionService.setTier('pro');
    if (onUpgrade) onUpgrade();
    onClose();
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="upgrade-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upgrade-header">
          <h2>⚡ Upgrade to Pro</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="upgrade-body">
          <div className="usage-warning">
            <span className="usage-icon">⚠️</span>
            <span>You've used {tierInfo.interviewsUsed}/{tierInfo.interviewsLimit} free interviews this month</span>
          </div>

          <div className="pricing-card">
            <div className="price">
              <span className="amount">${pricing.monthly.price}</span>
              <span className="interval">/month</span>
            </div>

            <ul className="feature-list">
              {pricing.monthly.features.map((feature, i) => (
                <li key={i}>
                  <span className="check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="upgrade-actions">
            <button className="btn-upgrade" onClick={handleUpgrade}>
              🚀 Upgrade Now — ${pricing.monthly.price}/mo
            </button>
            <button className="btn-simulate" onClick={handleSimulateUpgrade}>
              🧪 Activate Pro (Demo)
            </button>
            <button className="btn-cancel" onClick={onClose}>
              Maybe Later
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UpgradeModal;
