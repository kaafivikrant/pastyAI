const axios = require('axios');

class OllamaService {
  constructor(configService) {
    this.config = configService;
    this.baseURL = 'http://127.0.0.1:11434';
  }

  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      console.log('Ollama not available:', error.message);
      return false;
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error.message);
      return [];
    }
  }

  async processText(text, mode = null) {
    const currentMode = mode || this.config.getCurrentMode();
    const systemPrompt = this.config.getSystemPrompt(currentMode);
    
    // Debug logging and error handling
    console.log('Config object:', this.config);
    console.log('Config methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.config)));
    
    if (!this.config.getCurrentModel || typeof this.config.getCurrentModel !== 'function') {
      throw new Error('getCurrentModel method not found on config object');
    }
    
    const model = this.config.getCurrentModel();

    console.log(`Processing with mode: ${currentMode}, model: ${model}`);

    try {
      // First check if Ollama is available
      if (!(await this.isAvailable())) {
        throw new Error('Ollama is not running. Please start Ollama and ensure the model is available.');
      }

      // console.log(this.buildPrompt(systemPrompt, text));

      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: model,
        prompt: this.buildPrompt(systemPrompt, text),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }, {
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.response) {
        return response.data.response.trim();
      } else {
        throw new Error('No response from Ollama');
      }

    } catch (error) {
      console.error('Ollama processing error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama. Is it running?');
      } else if (error.response?.status === 404) {
        throw new Error(`Model "${model}" not found. Please pull it first: ollama pull ${model}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The text might be too long or the model is slow.');
      } else {
        throw new Error(`Ollama error: ${error.message}`);
      }
    }
  }

  buildPrompt(systemPrompt, userText) {
    return `${systemPrompt}\n\nText to process:\n${userText}\n\nResponse:`;
  }

  async testConnection() {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return { success: false, message: 'Ollama is not running' };
      }

      const models = await this.getAvailableModels();
      
      if (!this.config.getCurrentModel || typeof this.config.getCurrentModel !== 'function') {
        throw new Error('getCurrentModel method not found on config object');
      }
      
      const currentModel = this.config.getCurrentModel();
      const modelExists = models.some(m => m.name === currentModel);

      if (!modelExists) {
        return { 
          success: false, 
          message: `Model "${currentModel}" not found. Available models: ${models.map(m => m.name).join(', ')}` 
        };
      }

      // Test with a simple prompt
      const testResult = await this.processText('Hello', 'summarize');
      
      return {
        success: true,
        message: `Connected to Ollama successfully. Model: ${currentModel}`,
        testOutput: testResult.substring(0, 100) + (testResult.length > 100 ? '...' : '')
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  // Utility method to pull a model if it doesn't exist
  async pullModel(modelName) {
    try {
      console.log(`Pulling model: ${modelName}`);
      
      const response = await axios.post(`${this.baseURL}/api/pull`, {
        name: modelName
      });

      return { success: true, message: `Model ${modelName} pulled successfully` };
    } catch (error) {
      console.error('Error pulling model:', error.message);
      return { success: false, message: `Failed to pull model: ${error.message}` };
    }
  }
}

module.exports = OllamaService;