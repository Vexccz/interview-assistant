# InterviewAI

Real-time AI interview assistant with live transcription and smart response generation.

## Features

### Core
- **Live Transcription** — Real-time speech-to-text using Web Speech API or Deepgram
- **AI Response Generation** — Smart suggested responses via any OpenAI-compatible LLM
- **Question Type Detection** — Automatically detects behavioral, technical, situational questions
- **STAR Method Formatting** — Auto-formats behavioral answers with Situation/Task/Action/Result
- **Confidence Scoring** — Shows how well the AI can answer based on available context

### v0.2.0 New Features
- **Speaker Diarization** — Detects who is speaking (interviewer vs user) using audio energy levels
- **Multi-language Support** — English and Bahasa Malaysia with auto-detection
- **Audio Recording & Playback** — Records entire interview, playback in Analytics view
- **Company Research Auto-fetch** — Enter company name, auto-fetches context for LLM
- **Resume Parser** — Upload PDF/TXT resume, parsed text used as LLM context
- **Mock Interview Mode** — AI acts as interviewer, generates questions, evaluates your answers
- **Answer Scoring** — Each response scored 1-10 with improvement feedback
- **Code Snippets** — Technical questions include syntax-highlighted code examples
- **Keyboard Shortcuts** — Press `?` or `Ctrl+/` to see all shortcuts
- **Multiple Interview Profiles** — Save different resume/job/company combos, quick-switch
- **Interview History** — Past sessions saved with transcript and analytics (max 50, FIFO)
- **Export PDF** — Export transcript as formatted PDF
- **Notification Sound** — Subtle chime when AI response is ready (toggleable)
- **Windows Installer** — Package as .exe with NSIS installer
- **Auto-update Checker** — Checks GitHub releases for newer versions on startup
- **Portable Mode** — Run with `--portable` flag to store data in app directory

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Package as Windows .exe installer
npm run build:exe
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Space` | Cycle modes (Start → Pause → Hidden → Start) |
| `Ctrl+/` or `?` | Show keyboard shortcuts |
| `Ctrl+S` | Save transcript |
| `Ctrl+E` | Export transcript as PDF |
| `Ctrl+M` | Toggle mock interview mode |
| `Ctrl+H` | View interview history |
| `Ctrl+,` | Open settings |
| `Ctrl+K` | Clear transcript |
| `Escape` | Close current panel |

## Portable Mode

Run the app with the `--portable` flag to store all data (settings, profiles, history) in the app directory instead of AppData:

```bash
InterviewAI.exe --portable
```

This is useful for running from a USB drive or shared folder without leaving traces on the host system.

## Configuration

### LLM Setup
Supports any OpenAI-compatible API:
- **OpenAI** — Set API key and base URL `https://api.openai.com/v1`
- **Ollama** — Click "Use Ollama" button (auto-detects local instance)
- **DeepSeek, Groq, etc.** — Set appropriate base URL and API key

### Audio
- **Microphone Only** — Default, captures your mic
- **System Audio** — Captures desktop audio (interviewer on call)
- **Both** — Combines mic + system audio

### Profiles
Save multiple interview profiles in Settings → Profiles tab. Each profile stores:
- Resume text
- Job description
- Company name & info

Quick-switch between profiles for different job applications.

## Tech Stack
- Electron 33
- React 18 + Vite 6
- Framer Motion
- Web Speech API / Deepgram
- jsPDF for PDF export
- electron-builder for packaging

## License
MIT
