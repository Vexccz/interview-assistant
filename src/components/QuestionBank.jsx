import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../services/i18n';
import { QUESTION_BANK, getQuestionsByCategory } from '../services/questions';

const cardStagger = {
  animate: {
    transition: { staggerChildren: 0.05 }
  }
};

const cardItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
};

const filterPillVariants = {
  active: { backgroundColor: 'var(--accent-color, #3b82f6)', color: '#fff' },
  inactive: { backgroundColor: 'transparent', color: 'inherit' }
};

function QuestionBank({ onClose, onPractice, language }) {
  const [filter, setFilter] = useState('all');

  const questions = getQuestionsByCategory(filter);

  const categories = [
    { id: 'all', label: t('allCategories', language) },
    { id: 'behavioral', label: t('behavioral', language) },
    { id: 'technical', label: t('technical', language) },
    { id: 'general', label: t('general', language) }
  ];

  return (
    <div className="panel question-bank-panel">
      <div className="panel-header">
        <h2>{t('questionBankTitle', language)}</h2>
        <motion.button
          className="btn-icon"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      <div className="filter-tabs">
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ position: 'relative' }}
          >
            {cat.label}
            {filter === cat.id && (
              <motion.div
                layoutId="question-filter-indicator"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  backgroundColor: 'var(--accent-color, #3b82f6)',
                  opacity: 0.15,
                  zIndex: -1
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          className="question-list"
          variants={cardStagger}
          initial="initial"
          animate="animate"
        >
          {questions.map(q => (
            <motion.div
              key={q.id}
              className="question-item"
              variants={cardItem}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="question-item-content">
                <span className="question-category-badge">{q.label}</span>
                <p className="question-text">{q.question}</p>
              </div>
              <motion.button
                className="btn-practice"
                onClick={() => onPractice(q.question)}
                title={t('practiceThis', language)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {t('practiceThis', language)}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default QuestionBank;
