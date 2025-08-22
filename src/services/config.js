class ConfigService {
  constructor(store) {
    this.store = store;
    this.initializeDefaults();
  }

  initializeDefaults() {
    const defaults = {
      currentMode: 'summarize',
      model: {
        provider: 'ollama', // 'ollama', 'groq', 'openrouter'
        ollamaModel: 'qwen3:4b',
        groqApiKey: '',
        openrouterApiKey: '',
        groqModel: 'llama3-8b-8192',
        openrouterModel: 'meta-llama/llama-3-8b-instruct'
      },
      modes: {
        summarize: {
          name: 'Summarize',
          systemPrompt: 'You are a helpful assistant that summarizes text concisely. Provide a clear, bullet-pointed summary of the key points. Keep it brief but comprehensive.',
          hotkey: 'CommandOrControl+Shift+1'
        },
        translate: {
          name: 'Translate',
          systemPrompt: 'You are a translation assistant. Detect the language of the input text and translate it to English. If it\'s already in English, ask what language to translate it to.',
          hotkey: 'CommandOrControl+Shift+2'
        },
        simplify: {
          name: 'Simplify',
          systemPrompt: 'You are a helpful assistant that makes complex text easier to understand. Rewrite the text using simpler language while preserving the original meaning.',
          hotkey: 'CommandOrControl+Shift+3'
        },
        explain: {
          name: 'Explain',
          systemPrompt: 'You are a helpful assistant that provides detailed explanations. Take the input text and explain it in more detail, providing context and background information.',
          hotkey: 'CommandOrControl+Shift+4'
        },
        maths: {
          name: 'Maths',
          systemPrompt: 'You are a calculator. Only return the final numeric result of the given mathematical expression. No text, no explanation, no formatting — just the raw answer., do not write - Here is a concise summary of the calculation: The result of the calculation ',
          hotkey: 'CommandOrControl+Shift+5'
        }
      },
      history: {
        enabled: true,
        persistent: false,
        maxItems: 10
      }
    };

    // Set defaults if not already present
    for (const [key, value] of Object.entries(defaults)) {
      if (!this.store.has(key)) {
        this.store.set(key, value);
      }
    }
  }

  getCurrentMode() {
    return this.store.get('currentMode', 'summarize');
  }

  setCurrentMode(mode) {
    this.store.set('currentMode', mode);
  }

  getModeConfig(mode) {
    const modes = this.store.get('modes');
    return modes[mode] || modes.summarize;
  }

  getSystemPrompt(mode = null) {
    const currentMode = mode || this.getCurrentMode();
    const modeConfig = this.getModeConfig(currentMode);
    return modeConfig.systemPrompt;
  }

  getModelConfig() {
    return this.store.get('model');
  }

  setModelConfig(config) {
    this.store.set('model', { ...this.getModelConfig(), ...config });
  }

  getCurrentProvider() {
    return this.getModelConfig().provider;
  }

  getCurrentModel() {
    const modelConfig = this.getModelConfig();
    const provider = modelConfig.provider;
    
    switch (provider) {
      case 'ollama':
        return modelConfig.ollamaModel;
      case 'groq':
        return modelConfig.groqModel;
      case 'openrouter':
        return modelConfig.openrouterModel;
      default:
        return modelConfig.ollamaModel;
    }
  }

  getApiKey(provider = null) {
    const modelConfig = this.getModelConfig();
    const currentProvider = provider || modelConfig.provider;
    
    switch (currentProvider) {
      case 'groq':
        return modelConfig.groqApiKey;
      case 'openrouter':
        return modelConfig.openrouterApiKey;
      default:
        return null;
    }
  }

  getAllModes() {
    return this.store.get('modes');
  }

  updateModeConfig(mode, config) {
    const modes = this.store.get('modes');
    modes[mode] = { ...modes[mode], ...config };
    this.store.set('modes', modes);
  }

  getHistoryConfig() {
    return this.store.get('history');
  }

  setHistoryConfig(config) {
    this.store.set('history', { ...this.getHistoryConfig(), ...config });
  }

  // Helper method to check if Ollama is available
  async isOllamaAvailable() {
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Export/Import settings
  exportSettings() {
    return {
      currentMode: this.store.get('currentMode'),
      model: this.store.get('model'),
      modes: this.store.get('modes'),
      history: this.store.get('history')
    };
  }

  importSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
      this.store.set(key, value);
    }
  }
}

module.exports = ConfigService;
