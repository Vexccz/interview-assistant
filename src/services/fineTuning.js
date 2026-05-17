// Fine-Tuning Service
// Export training data from interview history as JSONL for fine-tuning
// Support custom fine-tuned model IDs

export class FineTuningService {
  // Export all past interview Q&A pairs as JSONL format for fine-tuning
  static exportTrainingData(options = {}) {
    const { format = 'openai', systemPrompt = '' } = options;
    
    // Get all history sessions
    const history = JSON.parse(localStorage.getItem('interview_history') || '[]');
    
    const pairs = [];
    
    for (const session of history) {
      if (!session.transcript || !Array.isArray(session.transcript)) continue;
      
      for (const entry of session.transcript) {
        if (!entry.question || !entry.response) continue;
        
        const pair = {
          question: entry.question.trim(),
          response: entry.response.trim(),
          type: entry.type || 'General',
          timestamp: entry.timestamp
        };
        
        pairs.push(pair);
      }
    }

    if (pairs.length === 0) {
      return { success: false, error: 'No training data found. Complete some interviews first.' };
    }

    let content = '';
    let filename = '';

    if (format === 'openai') {
      // OpenAI fine-tuning JSONL format
      const defaultSystem = systemPrompt || 
        'You are an expert interview coach. Given an interview question, provide a well-structured, professional answer that demonstrates competence and experience.';
      
      const lines = pairs.map(pair => {
        return JSON.stringify({
          messages: [
            { role: 'system', content: defaultSystem },
            { role: 'user', content: pair.question },
            { role: 'assistant', content: pair.response }
          ]
        });
      });
      
      content = lines.join('\n');
      filename = `interview-training-data-openai-${Date.now()}.jsonl`;
    } else if (format === 'together') {
      // Together.ai format
      const lines = pairs.map(pair => {
        return JSON.stringify({
          text: `<s>[INST] ${pair.question} [/INST] ${pair.response} </s>`
        });
      });
      
      content = lines.join('\n');
      filename = `interview-training-data-together-${Date.now()}.jsonl`;
    } else if (format === 'alpaca') {
      // Alpaca format
      const lines = pairs.map(pair => {
        return JSON.stringify({
          instruction: pair.question,
          input: '',
          output: pair.response
        });
      });
      
      content = lines.join('\n');
      filename = `interview-training-data-alpaca-${Date.now()}.jsonl`;
    }

    // Download the file
    const blob = new Blob([content], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return { 
      success: true, 
      count: pairs.length, 
      filename,
      format 
    };
  }

  // Get training data stats without exporting
  static getTrainingStats() {
    const history = JSON.parse(localStorage.getItem('interview_history') || '[]');
    
    let totalPairs = 0;
    const typeBreakdown = {};
    
    for (const session of history) {
      if (!session.transcript || !Array.isArray(session.transcript)) continue;
      
      for (const entry of session.transcript) {
        if (!entry.question || !entry.response) continue;
        totalPairs++;
        const type = entry.type || 'General';
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
      }
    }

    return {
      totalPairs,
      typeBreakdown,
      sessions: history.length,
      estimatedTokens: totalPairs * 500, // rough estimate
      readyForFineTuning: totalPairs >= 10 // OpenAI minimum is 10
    };
  }

  // Validate a custom model ID format
  static validateModelId(modelId) {
    if (!modelId || typeof modelId !== 'string') return false;
    
    // OpenAI fine-tuned model format: ft:model:org:custom-name:id
    const openaiPattern = /^ft:/;
    // Generic model ID (alphanumeric, hyphens, slashes, colons, dots)
    const genericPattern = /^[a-zA-Z0-9\-_./: ]+$/;
    
    return openaiPattern.test(modelId) || genericPattern.test(modelId);
  }

  // Get fine-tuning instructions
  static getInstructions(provider = 'openai') {
    const instructions = {
      openai: {
        title: 'Fine-tune with OpenAI',
        steps: [
          '1. Export your training data using the button above (OpenAI format)',
          '2. Go to https://platform.openai.com/finetune',
          '3. Click "Create" and upload your .jsonl file',
          '4. Select base model (gpt-4o-mini recommended for cost)',
          '5. Start training (usually takes 15-60 minutes)',
          '6. Copy the fine-tuned model ID (starts with ft:)',
          '7. Paste it in the "Custom Model ID" field above'
        ],
        minSamples: 10,
        estimatedCost: '$0.003 per 1K tokens'
      },
      together: {
        title: 'Fine-tune with Together.ai',
        steps: [
          '1. Export your training data (Together format)',
          '2. Go to https://api.together.xyz/playground',
          '3. Navigate to Fine-tuning section',
          '4. Upload your .jsonl file',
          '5. Select base model (Llama 3 recommended)',
          '6. Start training',
          '7. Use the model ID in your API settings'
        ],
        minSamples: 10,
        estimatedCost: '$0.50 per 1M tokens'
      }
    };

    return instructions[provider] || instructions.openai;
  }
}
