# ⚡ PastyAI

A lightweight macOS menu bar app for quick LLM text processing. Copy text, process it with AI, and paste the result - all with global hotkeys.

## 🚀 Features

- **Global Hotkeys**: `Cmd+Shift+C` to copy & process, `Cmd+Shift+V` to paste
- **Multiple Modes**: Summarize, Translate, Simplify, Explain
- **Local & Cloud Models**: Ollama (offline) + Groq/OpenRouter (cloud)
- **History**: Last 10 processed texts with one-click copy
- **Menu Bar Integration**: Minimal, native macOS experience

## 📋 Prerequisites

### For Ollama (Recommended - Offline & Private)

1. **Install Ollama**:
   ```bash
   brew install ollama
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve
   ```

3. **Pull a model** (in a new terminal):
   ```bash
   ollama pull qwen3:4b
   ```

### For Cloud Providers (Optional)

- **Groq**: Get API key from [console.groq.com](https://console.groq.com/)
- **OpenRouter**: Get API key from [openrouter.ai](https://openrouter.ai/)

## 🛠️ Installation

1. **Clone & Install**:
   ```bash
   git clone <your-repo>
   cd copyAI
   npm install
   ```

2. **Run in Development**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 📖 Usage

### Basic Workflow

1. **Select text** in any app (Safari, Notion, etc.)
2. **Copy it normally** (`Cmd+C`)
3. **Press `Cmd+Shift+C`** → QuickLLM processes the text
4. **Press `Cmd+Shift+V`** → Paste the processed result

### Menu Bar Interface

Click the ⚡ icon in your menu bar to:

- **Switch modes** (Summarize/Translate/Simplify/Explain)
- **View history** (click any item to copy it)
- **Open settings** to configure models/prompts
- **Test connection** to verify Ollama is working

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+C` | Copy selected text & process with current mode |
| `Cmd+Shift+V` | Paste last processed text |
| `Cmd+Shift+1` | Quick Summarize mode |
| `Cmd+Shift+2` | Quick Translate mode |

## ⚙️ Configuration

### Models

- **Ollama**: Runs locally, private, requires model download
  - Recommended: `qwen3:4b` (good balance of speed/quality)
  - Faster: `llama3.2:1b` (smaller, faster)
  - Better: `llama3.1:8b` (larger, higher quality)

- **Groq**: Cloud-based, very fast inference
- **OpenRouter**: Access to many different models

### Custom Prompts

Edit system prompts for each mode in Settings:

- **Summarize**: "Provide bullet-point summary..."
- **Translate**: "Detect language and translate to English..."
- **Simplify**: "Rewrite in simpler terms..."
- **Explain**: "Provide detailed explanation..."

## 🔧 Development

### Project Structure

```
copyAI/
├── src/
│   ├── main.js              # Main Electron process
│   ├── index.html           # Menu bar UI
│   ├── settings.html        # Settings window
│   └── services/
│       ├── config.js        # Configuration management
│       └── ollama.js        # Ollama API integration
├── assets/
│   └── *.png               # Menu bar icons
└── package.json
```

### Key Components

- **MenuBar App**: Uses `menubar` package for native macOS integration
- **Global Shortcuts**: `globalShortcut` API for system-wide hotkeys  
- **Clipboard**: `clipboardy` for reading/writing clipboard
- **Storage**: `electron-store` for persistent settings
- **IPC**: Communication between main process and UI

### Adding New Modes

1. Update `src/services/config.js` defaults
2. Add mode button to `src/index.html`
3. Register hotkey in `src/main.js`

## 🚀 Building & Distribution

```bash
# Build for current platform
npm run build

# Output will be in dist/ folder
# Creates .dmg installer for macOS
```

## 🐛 Troubleshooting

### "Ollama not running"
```bash
# Start Ollama service
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

### "Model not found"
```bash
# Pull the model
ollama pull qwen3:4b

# List available models
ollama list
```

### "Shortcuts not working"
- Check macOS Privacy settings
- Grant Accessibility permissions to the app

## 📝 Roadmap

- [x] **v1.0**: Core workflow with Ollama
- [ ] **v1.1**: Cloud providers (Groq, OpenRouter) 
- [ ] **v1.2**: Drag & drop window
- [ ] **v1.3**: Persistent history & search
- [ ] **v1.4**: Custom hotkey mapping
- [ ] **v1.5**: Multi-language UI

## 📄 License

MIT License - see LICENSE file for details.

---

**Pro Tip**: Start with Ollama + `qwen3:4b` for the best balance of speed, quality, and privacy! 🚀




What is "Hello" in hindi?

The language of the input text is English, and the text is "Hello". Since it's already in English, I'll ask: Which language would you like to translate "Hello" to?


Hello in hindi

"Hello" in Hindi is नमस्ते (Namaste).


1+2

Here is a concise summary of the calculation:

• The result of the calculation 1+2 is 3.
# pastyAI



1+333


Here is a summary of the calculation:

• The result of the calculation is: 334




Future Development

- Code Comment Generation: For developers, process selected code snippets to generate explanatory comments or documentation.

Implementation: Add a "Generate Comments" mode with a prompt like, "Add clear, concise comments to the following code snippet." Leverage Ollama’s larger models (e.g., llama3.1:8b) for better code understanding. Integrate with the clipboard workflow to process code copied from editors like VS Code.

- Searchable History: Allow users to search through past processed texts using keywords or filters (e.g., by mode or date).

Implementation: Store history in electron-store with metadata (timestamp, mode, input/output text). Add a search input field to src/index.html and filter history using JavaScript. Display results in a scrollable list with clickable items for copying.

- Pinned Favorites: Let users pin frequently used processed texts for quick access.

Implementation: Add a "Pin" button next to history items in the menu bar UI. Store pinned items separately in electron-store and display them at the top of the history list.

- Hotkey Customization UI: Add a settings panel to map custom shortcuts for each mode and action (e.g., copy, paste, mode switching).

Implementation: Extend src/settings.html with a hotkey configuration form. Use Electron’s globalShortcut API to register user-defined shortcuts dynamically. Store mappings in electron-store for persistence.

- Share Processed Text: Allow users to share processed text (e.g., summaries) directly to apps like Slack, Messages, or email.

Implementation: Add a “Share” button to the menu bar UI or drag-and-drop window. Use macOS’s share sheet API or integrate with APIs for Slack/Messages (requires OAuth for third-party services).

- Dynamic Language Switching: Allow users to switch the UI language (e.g., English, Spanish, Hindi).

Implementation: Use a library like i18next in Electron to manage translations. Store language files in assets/lang/ and add a language selector in src/settings.html.


- RTL Support: Support right-to-left languages like Arabic or Hebrew.

Implementation: Add CSS rules for RTL layouts in src/index.html and src/settings.html.






