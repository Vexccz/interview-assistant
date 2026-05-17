import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { t } from '../services/i18n';
import { UpdateCheckerService } from '../services/updateChecker';

function UpdateBanner() {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    const checker = new UpdateCheckerService();
    checker.check().then(result => {
      if (result.available) {
        setUpdate(result);
      }
    });
  }, []);

  if (!update || dismissed) return null;

  return (
    <motion.div
      className="update-banner"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="update-text">
        Update available: v{update.version}
      </span>
      <a
        className="update-link"
        href={update.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (window.electronAPI) {
            // Open in external browser
            require('electron').shell.openExternal(update.url);
          }
        }}
      >
        Download
      </a>
      <button className="btn-icon update-dismiss" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </motion.div>
  );
}

export default UpdateBanner;
