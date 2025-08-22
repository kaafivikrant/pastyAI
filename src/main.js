const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, clipboard, nativeImage } = require('electron');
const { menubar } = require('menubar');
const Store = require('electron-store');
const path = require('path');
const localShortcut = require('electron-localshortcut');
const robot = require('robotjs');

// Services
const OllamaService = require('./services/ollama');
const GroqService = require('./services/groq');
const OpenRouterService = require('./services/openrouter');
const ConfigService = require('./services/config');
const DatabaseService = require('./services/database');

class QuickLLMApp {
  constructor() {
    this.store = new Store();
    this.config = new ConfigService(this.store);
    
    // Initialize database service
    this.database = new DatabaseService();
    this.currentSessionId = null;
    
    // Initialize all AI service providers
    this.ollama = new OllamaService(this.config);
    this.groq = new GroqService(this.config);
    this.openrouter = new OpenRouterService(this.config);
    
    this.isProcessing = false;
    this.history = this.store.get('history', []);
    
    this.initializeApp();
  }

  initializeApp() {
    // Create menubar app with programmatic icon
    this.mb = menubar({
      index: `file://${path.join(__dirname, 'index.html')}`,
      icon: this.createIcon('#007AFF'),
      tooltip: 'QuickLLM',
      browserWindow: {
        width: 300,
        height: 400,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      }
    });

    this.setupEventHandlers();
    this.setupIPCHandlers();
  }

  setupEventHandlers() {
    this.mb.on('ready', async () => {
      console.log('QuickLLM is ready!');
      
      // Wait for database to be ready, then create a new session
      try {
        await this.database.waitForReady();
        const provider = this.config.getCurrentProvider();
        const model = this.config.getCurrentModel();
        this.currentSessionId = await this.database.createSession(provider, model);
        console.log(`Created session: ${this.currentSessionId}`);
      } catch (error) {
        console.error('Error creating session:', error);
      }
      
      this.setupGlobalShortcuts();
      this.updateMenuBarIcon('ready');
    });

    this.mb.on('after-create-window', () => {
      // Development tools
      if (process.argv.includes('--dev')) {
        this.mb.window.webContents.openDevTools();
      }
    });

    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });

    app.on('window-all-closed', (e) => {
      e.preventDefault(); // Don't quit on window close for menu bar apps
    });
  }

  // Helper method to get the current AI service based on provider setting
  getCurrentAIService() {
    const provider = this.config.getCurrentProvider();
    
    switch (provider) {
      case 'groq':
        return this.groq;
      case 'openrouter':
        return this.openrouter;
      case 'ollama':
      default:
        return this.ollama;
    }
  }

  setupGlobalShortcuts() {
    // Primary workflow: Cmd+Shift+C (copy and process)
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      this.handleCopyAndProcess();
    });

    // Paste processed text: Cmd+Shift+V
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      this.handlePasteProcessed();
    });

    // Quick modes
    globalShortcut.register('CommandOrControl+Shift+1', () => {
      this.handleQuickMode('summarize');
    });

    console.log('Global shortcuts registered');
  }

  async handleCopyAndProcess() {
    if (this.isProcessing) return;

    const startTime = Date.now();
    let requestId = null;

    try {
      this.isProcessing = true;
      this.updateMenuBarIcon('processing');

      // Get selected text from clipboard (user needs to copy first)
      const text = clipboard.readText();
      console.log('CopiedText', text);
      
      // Log clipboard copy operation
      if (this.currentSessionId) {
        try {
          await this.database.logClipboardOperation(
            this.currentSessionId, 
            'copy', 
            text || '', 
            null, 
            'shortcut'
          );
        } catch (dbError) {
          console.warn('Failed to log clipboard operation:', dbError);
        }
      }
      
      if (!text || text.trim().length === 0) {
        console.log('No text in clipboard');
        this.updateMenuBarIcon('ready');
        this.isProcessing = false;
        return;
      }

      console.log('Processing text:', text.substring(0, 50) + '...');

      // Get current mode and AI service details
      const mode = this.config.getCurrentMode();
      const provider = this.config.getCurrentProvider();
      const model = this.config.getCurrentModel();
      const aiService = this.getCurrentAIService();

      // Log the request to database
      if (this.currentSessionId) {
        try {
          requestId = await this.database.logRequest({
            sessionId: this.currentSessionId,
            provider,
            model,
            mode,
            inputText: text,
            status: 'pending'
          });
        } catch (dbError) {
          console.warn('Failed to log request:', dbError);
        }
      }

      // Process text with AI service
      const processedText = await aiService.processText(text, mode);
      const processingTime = Date.now() - startTime;
      
      console.log('processedText', processedText);
      console.log(`Processing completed in ${processingTime}ms`);

      // Update request with success status
      if (requestId) {
        try {
          await this.database.updateRequest(requestId, {
            output_text: processedText,
            output_length: processedText.length,
            processing_time_ms: processingTime,
            status: 'success'
          });
        } catch (dbError) {
          console.warn('Failed to update request:', dbError);
        }
      }

      // Store in both old history system and new database
      this.addToHistory(text, processedText, mode);
      
      if (this.currentSessionId) {
        try {
          await this.database.addToHistory(this.currentSessionId, {
            mode,
            originalText: text,
            processedText,
            provider,
            model,
            processingTimeMs: processingTime
          });
        } catch (dbError) {
          console.warn('Failed to add to database history:', dbError);
        }
      }

      // Copy processed text to clipboard
      clipboard.writeText(processedText);
      
      // Log clipboard paste operation
      if (this.currentSessionId) {
        try {
          await this.database.logClipboardOperation(
            this.currentSessionId, 
            'paste', 
            processedText, 
            mode, 
            'automatic'
          );
        } catch (dbError) {
          console.warn('Failed to log clipboard paste:', dbError);
        }
      }

      this.updateMenuBarIcon('success');
      
      // Reset icon after 2 seconds
      setTimeout(() => {
        this.updateMenuBarIcon('ready');
      }, 2000);

    } catch (error) {
      console.error('Error processing text:', error);
      
      // Update request with error status
      if (requestId) {
        try {
          await this.database.updateRequest(requestId, {
            status: 'error',
            error_message: error.message,
            processing_time_ms: Date.now() - startTime
          });
        } catch (dbError) {
          console.warn('Failed to update request with error:', dbError);
        }
      }
      
      this.updateMenuBarIcon('error');
      setTimeout(() => {
        this.updateMenuBarIcon('ready');
      }, 2000);
    } finally {
      this.isProcessing = false;
    }
  }

  handlePasteProcessed() {
    // For now, just get the last processed text from clipboard
    // In a more advanced version, we could maintain a separate buffer
    const text = clipboard.readText();
    console.log('Pasting processed text...');
    // The actual pasting will happen via standard Cmd+V since we put it in clipboard
  }

  async handleQuickMode(mode) {
    // Similar to handleCopyAndProcess but with specific mode
    console.log(`Quick mode: ${mode}`);
    // Implementation would be similar to handleCopyAndProcess
  }

  addToHistory(originalText, processedText, mode) {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      mode,
      original: originalText.substring(0, 100) + (originalText.length > 100 ? '...' : ''),
      processed: processedText,
    };

    this.history.unshift(historyItem);
    
    // Keep only last 10 items
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }

    this.store.set('history', this.history);
  }

  createIcon(color = '#007AFF') {
    // Create a simple 16x16 icon programmatically
    const canvas = {
      width: 16,
      height: 16,
      data: Buffer.alloc(16 * 16 * 4) // RGBA
    };
    
    // Fill with transparent pixels
    for (let i = 0; i < canvas.data.length; i += 4) {
      canvas.data[i] = 0;     // R
      canvas.data[i + 1] = 0; // G  
      canvas.data[i + 2] = 0; // B
      canvas.data[i + 3] = 0; // A (transparent)
    }
    
    // Draw a simple lightning bolt pattern in the center
    const coords = [[7,2], [6,3], [5,4], [6,5], [7,6], [8,7], [7,8], [6,9], [7,10]];
    const rgb = this.hexToRgb(color);
    
    coords.forEach(([x, y]) => {
      const index = (y * 16 + x) * 4;
      if (index < canvas.data.length - 3) {
        canvas.data[index] = rgb.r;     // R
        canvas.data[index + 1] = rgb.g; // G
        canvas.data[index + 2] = rgb.b; // B
        canvas.data[index + 3] = 255;   // A (opaque)
      }
    });
    
    return nativeImage.createFromBuffer(canvas.data, { width: 16, height: 16 });
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 122, b: 255 }; // Default to blue
  }

  updateMenuBarIcon(state) {
    let color;
    
    switch (state) {
      case 'processing':
        color = '#FFB800'; // Yellow
        break;
      case 'success':
        color = '#00C851'; // Green
        break;
      case 'error':
        color = '#FF4444'; // Red
        break;
      default:
        color = '#007AFF'; // Blue
    }

    if (this.mb && this.mb.tray) {
      this.mb.tray.setImage(this.createIcon(color));
    }
    
    // Send status update to renderer
    if (this.mb && this.mb.window) {
      this.mb.window.webContents.send('status-update', this.getStatusMessage(state), state);
    }
  }

  getStatusMessage(state) {
    switch (state) {
      case 'processing': return 'Processing text...';
      case 'success': return 'Text processed successfully!';
      case 'error': return 'Error processing text';
      default: return 'Ready';
    }
  }

  setupIPCHandlers() {
    // Handle mode changes from UI
    ipcMain.on('set-mode', (event, mode) => {
      console.log('Setting mode to:', mode);
      this.config.setCurrentMode(mode);
    });

    // Handle settings window request
    ipcMain.on('open-settings', (event) => {
      this.openSettingsWindow();
    });

    // Handle connection test
    ipcMain.on('test-connection', async (event) => {
      try {
        const aiService = this.getCurrentAIService();
        const result = await aiService.testConnection();
        event.reply('status-update', result.message, result.success ? 'success' : 'error');
      } catch (error) {
        event.reply('status-update', `Test failed: ${error.message}`, 'error');
      }
    });

    // Handle clear history
    ipcMain.on('clear-history', (event) => {
      this.history = [];
      this.store.set('history', []);
      event.reply('history-update', this.history);
    });

    // Handle request for initial data
    ipcMain.on('request-initial-data', (event) => {
      event.reply('mode-update', this.config.getCurrentMode());
      event.reply('history-update', this.history);
    });
  }

  openSettingsWindow() {
    // Create settings window (basic for now)
    const settingsWindow = new BrowserWindow({
      width: 600,
      height: 500,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'QuickLLM Settings',
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: false
    });

    settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
    
    settingsWindow.once('ready-to-show', () => {
      settingsWindow.show();
    });
  }
}

// Initialize app when Electron is ready
app.whenReady().then(() => {
  new QuickLLMApp();
});

// macOS specific: recreate window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // For menu bar apps, we don't recreate windows
  }
});
