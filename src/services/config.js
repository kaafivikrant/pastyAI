const KeyManager = require('./keyManager');

class ConfigService {
  constructor(store) {
    this.store = store;
    this.keyManager = new KeyManager();
    this.loadEnvironmentVariables();
    this.initializeDefaults();
  }

  loadEnvironmentVariables() {
    // Load environment variables from .env file
    require('dotenv').config();
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
        auto: {
          name: 'Auto',
          systemPrompt: 'You are a helpful assistant that automatically detects the best way to process text. Adapt your response based on the content.',
          hotkey: null
        },
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

  // Secure API key storage methods
  setApiKey(provider, apiKey) {
    try {
      if (!apiKey || apiKey.trim() === '') {
        // Clear the key if empty
        const modelConfig = this.getModelConfig();
        if (provider === 'groq') {
          modelConfig.groqApiKey = '';
        } else if (provider === 'openrouter') {
          modelConfig.openrouterApiKey = '';
        }
        this.setModelConfig(modelConfig);
        return { success: true, message: `${provider} API key cleared` };
      }

      // Validate and encrypt the key
      const validation = this.keyManager.validateApiKey(provider, apiKey);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const encryptedKey = this.keyManager.encryptKey(apiKey);
      const modelConfig = this.getModelConfig();
      
      if (provider === 'groq') {
        modelConfig.groqApiKey = encryptedKey;
      } else if (provider === 'openrouter') {
        modelConfig.openrouterApiKey = encryptedKey;
      }
      
      this.setModelConfig(modelConfig);
      
      const maskedKey = this.keyManager.maskKey(apiKey);
      console.log(`Securely stored ${provider} API key: ${maskedKey}`);
      
      return { 
        success: true, 
        message: `${provider} API key saved successfully`,
        masked: maskedKey 
      };
    } catch (error) {
      console.error('Error storing API key:', error);
      return { success: false, message: `Failed to store ${provider} API key: ${error.message}` };
    }
  }

  // Get masked API key for display
  getMaskedApiKey(provider) {
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      return '';
    }
    return this.keyManager.maskKey(apiKey);
  }

  // Validate stored API key
  validateStoredApiKey(provider) {
    const apiKey = this.getApiKey(provider);
    if (!apiKey) {
      return { valid: false, message: `No ${provider} API key configured` };
    }
    return this.keyManager.validateApiKey(provider, apiKey);
  }

  // Clear all API keys for security
  clearAllApiKeys() {
    const clearedKeys = this.keyManager.clearAllKeys();
    const modelConfig = this.getModelConfig();
    modelConfig.groqApiKey = '';
    modelConfig.openrouterApiKey = '';
    this.setModelConfig(modelConfig);
    return clearedKeys;
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
      case 'groq': {
        // First try to decrypt user-configured key
        const storedKey = modelConfig.groqApiKey;
        if (storedKey && storedKey.trim() !== '') {
          const decryptedKey = this.keyManager.retrieveKey(storedKey);
          if (decryptedKey) {
            return decryptedKey;
          }
        }
        // Fallback to environment variable for development only
        return process.env.GROQ_API_KEY || '';
      }
      case 'openrouter': {
        // First try to decrypt user-configured key
        const storedKey = modelConfig.openrouterApiKey;
        if (storedKey && storedKey.trim() !== '') {
          const decryptedKey = this.keyManager.retrieveKey(storedKey);
          if (decryptedKey) {
            return decryptedKey;
          }
        }
        // Fallback to environment variable for development only
        return process.env.OPENROUTER_API_KEY || '';
      }
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
