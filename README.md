# ⚡ QuickLLM

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

