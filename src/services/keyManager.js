const crypto = require('crypto');
const os = require('os');

class KeyManager {
  constructor() {
    // Use a machine-specific key derivation for encryption
    this.machineKey = this.getMachineKey();
  }

  getMachineKey() {
    // Create a machine-specific key based on hostname and platform
    const machineInfo = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    return crypto.createHash('sha256').update(machineInfo).digest();
  }

  // Encrypt API key for storage
  encryptKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return '';
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.machineKey);
      
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Error encrypting API key:', error);
      // Fallback to base64 encoding if encryption fails
      return Buffer.from(apiKey).toString('base64');
    }
  }

  // Decrypt API key from storage
  decryptKey(encryptedKey) {
    if (!encryptedKey || encryptedKey.trim() === '') {
      return '';
    }

    try {
      // Check if it's the new encrypted format (contains ':')
      if (encryptedKey.includes(':')) {
        const parts = encryptedKey.split(':');
        if (parts.length === 2) {
          const iv = Buffer.from(parts[0], 'hex');
          const encryptedData = parts[1];
          
          const decipher = crypto.createDecipher('aes-256-cbc', this.machineKey);
          let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          return decrypted;
        }
      }
      
      // Fallback for base64 encoded keys (backwards compatibility)
      try {
        return Buffer.from(encryptedKey, 'base64').toString('utf8');
      } catch {
        // If it's neither encrypted nor base64, assume it's plain text (development/migration)
        return encryptedKey;
      }
    } catch (error) {
      console.error('Error decrypting API key:', error);
      // Return empty string on decryption failure for security
      return '';
    }
  }

  // Hash key for verification without storing the actual key
  hashKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return '';
    }

    return crypto.createHash('sha256').update(apiKey + this.machineKey.toString('hex')).digest('hex');
  }

  // Verify if a key matches the stored hash
  verifyKey(apiKey, storedHash) {
    if (!apiKey || !storedHash) {
      return false;
    }

    return this.hashKey(apiKey) === storedHash;
  }

  // Mask key for display (show only first 3 and last 3 characters)
  maskKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
      return apiKey ? '***' : '';
    }

    return apiKey.substring(0, 3) + '*'.repeat(Math.max(apiKey.length - 6, 4)) + apiKey.substring(apiKey.length - 3);
  }

  // Validate API key format
  validateApiKey(provider, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, message: 'API key is required' };
    }

    const key = apiKey.trim();

    switch (provider) {
      case 'groq':
        // Groq keys typically start with 'gsk_' and are 56 characters long
        if (key.startsWith('gsk_') && key.length === 56) {
          return { valid: true, message: 'Valid Groq API key format' };
        }
        return { valid: false, message: 'Invalid Groq API key format (should start with gsk_ and be 56 characters)' };

      case 'openrouter':
        // OpenRouter keys typically start with 'sk-or-' and are variable length
        if (key.startsWith('sk-or-') && key.length >= 20) {
          return { valid: true, message: 'Valid OpenRouter API key format' };
        }
        return { valid: false, message: 'Invalid OpenRouter API key format (should start with sk-or-)' };

      default:
        return { valid: true, message: 'Unknown provider, cannot validate format' };
    }
  }

  // Secure key storage operations
  storeKey(provider, apiKey) {
    const validation = this.validateApiKey(provider, apiKey);
    if (!validation.valid) {
      throw new Error(`Invalid API key: ${validation.message}`);
    }

    const encrypted = this.encryptKey(apiKey);
    const hash = this.hashKey(apiKey);

    return {
      encrypted,
      hash,
      masked: this.maskKey(apiKey),
      timestamp: new Date().toISOString()
    };
  }

  retrieveKey(encryptedKey) {
    return this.decryptKey(encryptedKey);
  }

  // Generate a test key for development (DO NOT USE IN PRODUCTION)
  generateTestKey(provider) {
    console.warn('⚠️ Generating test key for development only!');
    
    switch (provider) {
      case 'groq':
        return 'gsk_' + crypto.randomBytes(26).toString('hex');
      case 'openrouter':
        return 'sk-or-' + crypto.randomBytes(20).toString('hex');
      default:
        return 'test_' + crypto.randomBytes(16).toString('hex');
    }
  }

  // Clear all stored keys (for security purposes)
  clearAllKeys() {
    console.log('Clearing all stored API keys for security');
    return {
      groqApiKey: '',
      openrouterApiKey: '',
      clearedAt: new Date().toISOString()
    };
  }
}

module.exports = KeyManager;
