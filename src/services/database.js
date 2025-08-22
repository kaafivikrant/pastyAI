const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor(dbPath = null) {
    // Default to user data directory if no path specified
    this.dbPath = dbPath || path.join(process.env.HOME || process.env.USERPROFILE, '.quickllm', 'data.db');
    
    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = null;
    this.isReady = false;
    this.initPromise = this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log(`Connected to SQLite database at ${this.dbPath}`);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Sessions table - tracks user sessions
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        provider TEXT,
        model TEXT,
        total_requests INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Requests table - tracks all AI requests and responses
      `CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        mode TEXT NOT NULL,
        input_text TEXT NOT NULL,
        output_text TEXT,
        input_length INTEGER,
        output_length INTEGER,
        processing_time_ms INTEGER,
        status TEXT DEFAULT 'pending', -- pending, success, error
        error_message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,
      
      // Clipboard data table - tracks copy/paste operations
      `CREATE TABLE IF NOT EXISTS clipboard_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        operation_type TEXT NOT NULL, -- copy, paste, process
        content TEXT NOT NULL,
        content_length INTEGER,
        mode TEXT,
        source TEXT, -- manual, shortcut, ui
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,
      
      // History table - user's processing history (similar to current store-based system)
      `CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        mode TEXT NOT NULL,
        original_text TEXT NOT NULL,
        processed_text TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        processing_time_ms INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,
      
      // Settings backup table
      `CREATE TABLE IF NOT EXISTS settings_backup (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        backup_name TEXT,
        settings_json TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_requests_session ON requests(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_clipboard_session ON clipboard_operations(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_history_session ON history(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp)'
    ];

    try {
      // Create tables
      for (const table of tables) {
        await this.run(table);
      }
      
      // Create indexes
      for (const index of indexes) {
        await this.run(index);
      }
      
      console.log('Database tables and indexes created successfully');
      this.isReady = true;
    } catch (error) {
      console.error('Error creating database tables:', error);
      throw error;
    }
  }

  // Method to ensure database is ready before operations
  async waitForReady() {
    if (!this.isReady) {
      await this.initPromise;
    }
    return this.isReady;
  }

  // Promisified database methods
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Session management
  async createSession(providrr = 'ollama', model = 'unknown') {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.run(
      `INSERT INTO sessions (session_id, provider, model) VALUES (?, ?, ?)`,
      [sessionId, providrr, model]
    );
    
    return sessionId;
  }

  async updateSession(sessionId, updates = {}) {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    
    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(sessionId);
      
      await this.run(
        `UPDATE sessions SET ${fields.join(', ')} WHERE session_id = ?`,
        values
      );
    }
  }

  async endSession(sessionId) {
    await this.updateSession(sessionId, { end_time: new Date().toISOString() });
  }

  // Request logging
  async logRequest(data) {
    const {
      sessionId,
      provider,
      model,
      mode,
      inputText,
      outputText = null,
      processingTimeMs = null,
      status = 'pending',
      errorMessage = null
    } = data;

    const result = await this.run(
      `INSERT INTO requests (
        session_id, provider, model, mode, input_text, output_text,
        input_length, output_length, processing_time_ms, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        provider,
        model,
        mode,
        inputText,
        outputText,
        inputText ? inputText.length : 0,
        outputText ? outputText.length : 0,
        processingTimeMs,
        status,
        errorMessage
      ]
    );

    return result.id;
  }

  async updateRequest(requestId, updates) {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    
    if (fields.length > 0) {
      values.push(requestId);
      await this.run(
        `UPDATE requests SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }
  }

  // Clipboard operations
  async logClipboardOperation(sessionId, operationType, content, mode = null, source = 'unknown') {
    await this.run(
      `INSERT INTO clipboard_operations (session_id, operation_type, content, content_length, mode, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, operationType, content, content.length, mode, source]
    );
  }

  // History management
  async addToHistory(sessionId, data) {
    const {
      mode,
      originalText,
      processedText,
      provider,
      model,
      processingTimeMs = null
    } = data;

    await this.run(
      `INSERT INTO history (session_id, mode, original_text, processed_text, provider, model, processing_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, mode, originalText, processedText, provider, model, processingTimeMs]
    );
  }

  async getHistory(sessionId = null, limit = 10, offset = 0) {
    let sql = `SELECT * FROM history`;
    let params = [];
    
    if (sessionId) {
      sql += ` WHERE session_id = ?`;
      params.push(sessionId);
    }
    
    sql += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await this.all(sql, params);
  }

  async clearHistory(sessionId = null) {
    if (sessionId) {
      await this.run(`DELETE FROM history WHERE session_id = ?`, [sessionId]);
    } else {
      await this.run(`DELETE FROM history`);
    }
  }

  // Analytics and reporting
  async getSessionStats(sessionId) {
    const stats = await this.get(`
      SELECT 
        s.session_id,
        s.start_time,
        s.end_time,
        s.provider,
        s.model,
        COUNT(r.id) as total_requests,
        SUM(CASE WHEN r.status = 'success' THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN r.status = 'error' THEN 1 ELSE 0 END) as failed_requests,
        AVG(r.processing_time_ms) as avg_processing_time,
        SUM(r.input_length) as total_input_chars,
        SUM(r.output_length) as total_output_chars
      FROM sessions s
      LEFT JOIN requests r ON s.session_id = r.session_id
      WHERE s.session_id = ?
      GROUP BY s.session_id
    `, [sessionId]);

    return stats;
  }

  async getRecentSessions(limit = 10) {
    return await this.all(`
      SELECT 
        session_id,
        start_time,
        end_time,
        provider,
        model,
        total_requests
      FROM sessions 
      ORDER BY start_time DESC 
      LIMIT ?
    `, [limit]);
  }

  // Settings backup
  async backupSettings(settingsJson, backupName = null) {
    const name = backupName || `backup_${new Date().toISOString()}`;
    
    await this.run(
      `INSERT INTO settings_backup (backup_name, settings_json) VALUES (?, ?)`,
      [name, JSON.stringify(settingsJson)]
    );
  }

  async getSettingsBackups(limit = 5) {
    return await this.all(
      `SELECT * FROM settings_backup ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  // Database maintenance
  async vacuum() {
    await this.run('VACUUM');
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      });
    }
  }

  // Export data
  async exportData() {
    const data = {
      sessions: await this.all('SELECT * FROM sessions ORDER BY start_time DESC'),
      requests: await this.all('SELECT * FROM requests ORDER BY timestamp DESC'),
      history: await this.all('SELECT * FROM history ORDER BY timestamp DESC'),
      clipboardOps: await this.all('SELECT * FROM clipboard_operations ORDER BY timestamp DESC'),
      exportTimestamp: new Date().toISOString()
    };

    return data;
  }
}

module.exports = DatabaseService;
