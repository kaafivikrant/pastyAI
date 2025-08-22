class IntentDetectionService {
  constructor(configService) {
    this.config = configService;
    this.intentRules = this.initializeIntentRules();
  }

  initializeIntentRules() {
    return {
      // Mathematical expressions
      maths: {
        patterns: [
          /^\s*[\d\+\-\*\/\(\)\.\s\^%]+\s*$/,  // Simple math expressions
          /^\s*\d+(\.\d+)?\s*[\+\-\*\/]\s*\d+(\.\d+)?\s*$/,  // Basic operations
          /calculate|compute|solve|math|equation|formula/i,
          /what\s+is\s+\d+/i,
          /\d+\s*[\+\-\*\/]\s*\d+/,  // Contains math operations
          /(\d+\s*\%|\d+\s*percent)/i  // Percentages
        ],
        keywords: ['calculate', 'compute', 'solve', 'math', 'equation', 'formula', 'result', 'answer'],
        confidence: 0.9
      },

      // Translation requests
      translate: {
        patterns: [
          /translate|translation|convert.*language|language.*convert/i,
          /(spanish|french|german|italian|portuguese|chinese|japanese|korean|arabic|hindi|russian)/i,
          /what.*mean.*in\s+(english|spanish|french)/i,
          /how.*say.*in\s+(english|spanish|french)/i,
          /\b(hola|bonjour|guten tag|ciao|konnichiwa|привет|你好)/i  // Common greetings
        ],
        keywords: ['translate', 'translation', 'language', 'mean', 'say', 'español', 'français'],
        confidence: 0.85
      },

      // Explanation requests
      explain: {
        patterns: [
          /explain|clarify|what.*mean|how.*work|why.*important/i,
          /can.*you.*explain|please.*explain|help.*understand/i,
          /what.*is|how.*does|why.*does|when.*should/i,
          /definition|concept|principle|theory|mechanism/i
        ],
        keywords: ['explain', 'clarify', 'understand', 'mean', 'definition', 'concept', 'how', 'why', 'what'],
        confidence: 0.75
      },

      // Simplification requests
      simplify: {
        patterns: [
          /simplify|simple.*terms|easier.*understand|break.*down/i,
          /too.*complex|complicated|difficult.*understand/i,
          /plain.*english|layman.*terms|simple.*words/i,
          /make.*simpler|easier.*version/i
        ],
        keywords: ['simplify', 'simple', 'easier', 'complex', 'complicated', 'plain', 'layman'],
        confidence: 0.8
      },

      // Summarization (default for long text)
      summarize: {
        patterns: [
          /summary|summarize|brief|overview|key.*points/i,
          /main.*points|important.*parts|tl;dr|tldr/i,
          /condense|compress|short.*version/i
        ],
        keywords: ['summary', 'summarize', 'brief', 'overview', 'key', 'main', 'important'],
        confidence: 0.7,
        lengthBased: true  // Will be triggered for longer texts
      }
    };
  }

  detectIntent(text) {
    if (!text || text.trim().length === 0) {
      return { intent: 'summarize', confidence: 0.5, reason: 'default' };
    }

    const cleanText = text.trim().toLowerCase();
    const results = [];

    // Check each intent type
    for (const [intentType, rules] of Object.entries(this.intentRules)) {
      let score = 0;
      const matches = [];

      // Pattern matching
      for (const pattern of rules.patterns) {
        if (pattern.test(text)) {
          score += 0.3;
          matches.push(`pattern: ${pattern.source.substring(0, 50)}...`);
        }
      }

      // Keyword matching
      let keywordMatches = 0;
      for (const keyword of rules.keywords) {
        if (cleanText.includes(keyword.toLowerCase())) {
          keywordMatches++;
          matches.push(`keyword: ${keyword}`);
        }
      }
      
      if (keywordMatches > 0) {
        score += (keywordMatches / rules.keywords.length) * 0.4;
      }

      // Length-based scoring (for summarization)
      if (rules.lengthBased && text.length > 500) {
        score += 0.3;
        matches.push('length-based trigger');
      }

      // Special case: Mathematical expressions
      if (intentType === 'maths' && this.isMathExpression(text)) {
        score += 0.5;
        matches.push('math expression detected');
      }

      // Apply confidence multiplier
      const finalScore = score * rules.confidence;

      if (finalScore > 0) {
        results.push({
          intent: intentType,
          confidence: Math.min(finalScore, 1.0),
          matches,
          reason: matches.join(', ')
        });
      }
    }

    // Sort by confidence and return the best match
    results.sort((a, b) => b.confidence - a.confidence);

    if (results.length > 0 && results[0].confidence > 0.3) {
      return results[0];
    }

    // Default fallback based on text characteristics
    return this.getDefaultIntent(text);
  }

  isMathExpression(text) {
    const trimmed = text.trim();
    
    // Check if it's a pure mathematical expression
    const mathOnlyRegex = /^[\d\+\-\*\/\(\)\.\s\^%=]+$/;
    if (mathOnlyRegex.test(trimmed)) {
      return true;
    }

    // Check if it contains clear mathematical operators
    const hasOperators = /[\+\-\*\/\^%]/g.test(trimmed);
    const hasNumbers = /\d/g.test(trimmed);
    
    if (hasOperators && hasNumbers) {
      // Count non-math characters
      const mathChars = trimmed.match(/[\d\+\-\*\/\(\)\.\s\^%=]/g);
      const mathRatio = mathChars ? mathChars.length / trimmed.length : 0;
      return mathRatio > 0.7;
    }

    return false;
  }

  getDefaultIntent(text) {
    const textLength = text.length;
    
    // For very short text, try to explain
    if (textLength < 50) {
      return {
        intent: 'explain',
        confidence: 0.4,
        reason: 'short text - default to explanation'
      };
    }
    
    // For medium text, try to simplify
    if (textLength < 200) {
      return {
        intent: 'simplify',
        confidence: 0.4,
        reason: 'medium text - default to simplification'
      };
    }
    
    // For longer text, summarize
    return {
      intent: 'summarize',
      confidence: 0.5,
      reason: 'long text - default to summarization'
    };
  }

  // Method to get intent with user override capability
  async getProcessingIntent(text, userMode = null) {
    if (userMode && userMode !== 'auto') {
      return {
        intent: userMode,
        confidence: 1.0,
        reason: 'user specified mode'
      };
    }

    const detectedIntent = this.detectIntent(text);
    
    // Log the detection for debugging
    console.log(`Intent Detection Result:`, {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      detected: detectedIntent.intent,
      confidence: detectedIntent.confidence.toFixed(2),
      reason: detectedIntent.reason
    });

    return detectedIntent;
  }

  // Method to add custom intent patterns
  addCustomIntent(intentName, patterns, keywords, confidence = 0.7) {
    this.intentRules[intentName] = {
      patterns: patterns.map(p => new RegExp(p, 'i')),
      keywords,
      confidence
    };
  }

  // Method to get available intents
  getAvailableIntents() {
    return Object.keys(this.intentRules);
  }

  // Method to test intent detection (for debugging)
  testIntent(text) {
    const result = this.detectIntent(text);
    return {
      text,
      intent: result.intent,
      confidence: result.confidence,
      reason: result.reason,
      availableIntents: this.getAvailableIntents()
    };
  }
}

module.exports = IntentDetectionService;
