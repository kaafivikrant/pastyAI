const axios = require('axios');

class OpenRouterService {
  constructor(configService) {
    this.config = configService;
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  async isAvailable() {
    try {
      const apiKey = this.config.getApiKey('openrouter');
      if (!apiKey) {
        console.log('OpenRouter API key not configured');
        return false;
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.log('OpenRouter not available:', error.message);
      return false;
    }
  }

  async getAvailableModels() {
    try {
      const apiKey = this.config.getApiKey('openrouter');
      if (!apiKey) {
        return [];
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error.message);
      return [];
    }
  }

  async processText(text, mode = null) {
    const currentMode = mode || this.config.getCurrentMode();
    const systemPrompt = this.config.getSystemPrompt(currentMode);
    const model = this.config.getCurrentModel();
    const apiKey = this.config.getApiKey('openrouter');

    console.log(`Processing with mode: ${currentMode}, model: ${model}`);

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please add your API key in settings.');
    }

    try {
      // Check if OpenRouter is available
      if (!(await this.isAvailable())) {
        throw new Error('Cannot connect to OpenRouter API. Please check your internet connection and API key.');
      }

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://quickllm.app', // Required by OpenRouter
          'X-Title': 'QuickLLM' // Required by OpenRouter
        },
        timeout: 30000
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error('No response from OpenRouter API');
      }

    } catch (error) {
      console.error('OpenRouter processing error:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key. Please check your API key in settings.');
      } else if (error.response?.status === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please wait and try again.');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error?.message || 'Invalid request to OpenRouter API';
        throw new Error(`OpenRouter API error: ${errorMsg}`);
      } else if (error.response?.status === 402) {
        throw new Error('Insufficient credits on OpenRouter. Please check your account balance.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to OpenRouter API. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please try again.');
      } else {
        throw new Error(`OpenRouter error: ${error.message}`);
      }
    }
  }

  buildPrompt(systemPrompt, userText) {
    // This method is for compatibility with the existing interface
    // OpenRouter uses the messages format, so this is mainly for logging
    return `System: ${systemPrompt}\n\nUser: ${userText}`;
  }

  async testConnection() {
    try {
      const apiKey = this.config.getApiKey('openrouter');
      
      if (!apiKey) {
        return { 
          success: false, 
          message: 'OpenRouter API key not configured. Please add your API key in settings.' 
        };
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return { success: false, message: 'Cannot connect to OpenRouter API' };
      }

      const models = await this.getAvailableModels();
      const currentModel = this.config.getCurrentModel();
      const modelExists = models.some(m => m.id === currentModel);

      if (!modelExists) {
        return { 
          success: false, 
          message: `Model "${currentModel}" not found. Available models: ${models.slice(0, 5).map(m => m.id).join(', ')}${models.length > 5 ? '...' : ''}` 
        };
      }

      // Test with a simple prompt
      const testResult = await this.processText('Hello', 'summarize');
      
      return {
        success: true,
        message: `Connected to OpenRouter successfully. Model: ${currentModel}`,
        testOutput: testResult.substring(0, 100) + (testResult.length > 100 ? '...' : '')
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  // Get account information (credits, etc.)
  async getAccountInfo() {
    try {
      const apiKey = this.config.getApiKey('openrouter');
      if (!apiKey) {
        return null;
      }

      const response = await axios.get(`${this.baseURL}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching OpenRouter account info:', error.message);
      return null;
    }
  }
}

module.exports = OpenRouterService;
