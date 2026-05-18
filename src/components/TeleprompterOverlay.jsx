import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const hintVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2 } }
};

const containerVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }
};

function TeleprompterOverlay({ hints, visible, settings, onDismiss }) {
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const hintSettings = {
    opacity: settings.liveHintsOpacity || 0.4,
    position: settings.liveHintsPosition || 'bottom-right',
    mode: settings.liveHintsMode || 'practice'
  };

  // Get position styles based on setting or dragged position
  const getPositionStyle = () => {
    if (position) {
      return { left: position.x, top: position.y, right: 'auto', bottom: 'auto' };
    }

    switch (hintSettings.position) {
      case 'top-left':
        return { top: 60, left: 16, right: 'auto', bottom: 'auto' };
      case 'top-right':
        return { top: 60, right: 16, left: 'auto', bottom: 'auto' };
      case 'bottom-left':
        return { bottom: 16, left: 16, right: 'auto', top: 'auto' };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16, left: 'auto', top: 'auto' };
    }
  };

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.teleprompter-dismiss')) return;
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: rect.left,
      posY: rect.top
    };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset position when position setting changes
  useEffect(() => {
    setPosition(null);
  }, [hintSettings.position]);

  if (!visible || !hints || !hints.hints || hints.hints.length === 0) {
    return null;
  }

  const isCompact = hintSettings.mode === 'live';

  return (
    <AnimatePresence>
      <motion.div
        ref={dragRef}
        className={`teleprompter-overlay ${isCompact ? 'teleprompter-compact' : ''}`}
        style={{
          ...getPositionStyle(),
          opacity: hintSettings.opacity,
          cursor: isDragging ? 'grabbing' : 'grab',
          fontSize: `${settings.fontSize || 14}px`
        }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onMouseDown={handleMouseDown}
      >
        <div className="teleprompter-header">
          <span className="teleprompter-label">
            {isCompact ? '⚡ Hints' : '💡 Talking Points'}
          </span>
          <button
            className="teleprompter-dismiss btn-icon"
            onClick={onDismiss}
            title="Dismiss (Ctrl+Shift+H)"
          >
            ✕
          </button>
        </div>

        <div className="teleprompter-content">
          {isCompact ? (
            // Compact mode: single line keywords
            <div className="teleprompter-keywords">
              {hints.hints.map((hint, i) => (
                <motion.span
                  key={i}
                  className="teleprompter-keyword"
                  variants={hintVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.05 }}
                >
                  {hint}
                </motion.span>
              ))}
            </div>
          ) : (
            // Full mode: bullet points
            <ul className="teleprompter-hints-list">
              {hints.hints.map((hint, i) => (
                <motion.li
                  key={i}
                  className="teleprompter-hint-item"
                  variants={hintVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ delay: i * 0.08 }}
                >
                  {hint}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TeleprompterOverlay;
