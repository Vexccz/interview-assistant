# Interview Assistant

Real-time AI interview assistant that listens to interviewer questions via microphone, transcribes them live, and generates smart suggested responses.

## Features

- **Live Transcription** — Real-time speech-to-text of interviewer's questions
- **AI Response Generation** — Streaming AI-generated suggested answers
- **Context-Aware** — Uses your resume, job description, and conversation history
- **Overlay Mode** — Transparent, always-on-top, frameless window
- **Global Hotkey** — Ctrl+Shift+Space to toggle listening
- **Flexible LLM** — Works with OpenAI, DeepSeek, Ollama, or any OpenAI-compatible API
- **Free STT** — Uses Web Speech API by default (no API key needed), with optional Deepgram upgrade

## Quick Start

### Prerequisites

- Node.js 18+
- An OpenAI-compatible LLM API endpoint (or local Ollama)

### Setup

```bash
# Clone the repo
git clone https://github.com/Vexccz/interview-assistant.git
cd interview-assistant

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Configuration

1. Click the ⚙️ gear icon in the app
2. Set your LLM API endpoint:
   - **OpenAI**: Base URL `https://api.openai.com/v1`, add your API key
   - **Ollama (local)**: Base URL `http://localhost:11434/v1`, no API key needed
   - **DeepSeek**: Base URL `https://api.deepseek.com/v1`, add your API key
3. Paste your resume and job description for context-aware responses
4. Click Save

### Usage

1. Start the app with `npm run dev`
2. Press **Ctrl+Shift+Space** or click **Start** to begin listening
3. The app transcribes what the interviewer says in real-time
4. After 2 seconds of silence, it generates a suggested response
5. Read the suggested response naturally during your interview

## Tech Stack

- **Electron** — Desktop app framework
- **React + Vite** — Frontend UI
- **Web Speech API** — Free speech-to-text (default)
- **Deepgram** — Optional premium STT
- **OpenAI-compatible API** — LLM response generation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+Space | Toggle listening on/off |

## Build for Production

```bash
npm run build
```

## Project Structure

```
interview-assistant/
├── package.json
├── vite.config.js
├── index.html
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # IPC bridge
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main app component
│   ├── styles.css       # Global styles
│   ├── components/
│   │   ├── Overlay.jsx  # Transcription + response display
│   │   ├── Settings.jsx # Settings panel
│   │   └── Controls.jsx # Start/stop controls
│   └── services/
│       ├── stt.js       # Speech-to-text service
│       ├── llm.js       # LLM API service
│       └── audio.js     # Audio capture
├── .env.example
└── .gitignore
```

## License

MIT
