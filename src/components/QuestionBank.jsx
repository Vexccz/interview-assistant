import React, { useState } from 'react';
import { t } from '../services/i18n';
import { QUESTION_BANK, getQuestionsByCategory } from '../services/questions';

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
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="filter-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="question-list">
        {questions.map(q => (
          <div key={q.id} className="question-item">
            <div className="question-item-content">
              <span className="question-category-badge">{q.label}</span>
              <p className="question-text">{q.question}</p>
            </div>
            <button
              className="btn-practice"
              onClick={() => onPractice(q.question)}
              title={t('practiceThis', language)}
            >
              {t('practiceThis', language)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionBank;
