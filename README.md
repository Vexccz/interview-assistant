# InterviewAI 🎯

Real-time AI interview assistant with live transcription, smart response generation, and coaching — all in a sleek always-on-top overlay.

> Your secret weapon for acing interviews. Works with OpenAI, Ollama, or any OpenAI-compatible LLM.

## ✨ Features

### Core
- **Live Transcription** — Real-time speech-to-text with Web Speech API or Deepgram
- **AI Response Generation** — Instant, context-aware answer suggestions using your resume & job description
- **Speaker Diarization** — Distinguishes between interviewer and candidate
- **Always-on-Top Overlay** — Transparent, minimal UI that stays visible during video calls
- **Multiple Audio Modes** — Mic only, system audio, or both

### AI-Powered
- **Real-time Coaching** — Pace monitoring, length feedback, and tips while you speak
- **Post-Interview Report Card** — Overall score, strengths, weaknesses, and question-by-question breakdown
- **Interview Prep Checklist** — AI-generated preparation based on job description & company
- **Answer Scoring** — Each response rated 1-10 with improvement feedback
- **RAG Mode** — Upload company docs for context-enriched responses
- **Mock Interviews** — Practice with AI-generated questions and get scored

### Tools
- **Question Bank** — Browse common interview questions by category
- **PDF Export** — Export full interview transcript as PDF
- **Interview History** — Review past sessions with analytics
- **Company Research** — Auto-research company context
- **Multi-language** — English and more

### Polish
- **Onboarding Wizard** — 3-step setup for first-time users
- **Splash Screen** — Branded loading screen on launch
- **Keyboard Shortcuts** — Full keyboard control (press `?` to see all)
- **Profiles** — Save different configurations for different roles
- **Portable Mode** — Run with `--portable` flag for USB deployment
- **Dark/Light Theme** — Zinc-based dark theme (default) or light mode

## 📸 Screenshots

<!-- Add screenshots here -->
![Main Overlay](screenshots/overlay.png)
![Report Card](screenshots/report-card.png)
![Prep Checklist](screenshots/prep-checklist.png)

## ⬇️ Installation

### Download Installer (Recommended)
1. Go to [Releases](https://github.com/Vexccz/interview-assistant/releases/latest)
2. Download the `.exe` installer
3. Run and install

### Build from Source
```bash
git clone https://github.com/Vexccz/interview-assistant.git
cd interview-assistant
npm install
npm run dev
```

### Build Installer
```bash
npm run build:exe
```
Output will be in the `release/` folder.

## ⚙️ Configuration

### LLM Setup
InterviewAI works with any OpenAI-compatible API:

| Provider | Base URL | Notes |
|----------|----------|-------|
| OpenAI | `https://api.openai.com/v1` | Requires API key |
| Ollama | `http://localhost:11434/v1` | Free, local, no key needed |
| LM Studio | `http://localhost:1234/v1` | Free, local |
| Any compatible | Your endpoint | Custom providers |

### First Launch
The onboarding wizard will guide you through:
1. Connecting your LLM
2. Uploading your resume
3. You're ready to go!

### Settings
Access via `Ctrl+,` or the ⚙️ button:
- **Resume** — Your experience for context
- **Job Description** — The role you're interviewing for
- **Company Info** — Company details for tailored responses
- **Audio Mode** — Mic, system audio, or both
- **Response Mode** — Concise or detailed answers
- **STAR Format** — Structure answers using STAR method
- **RAG Documents** — Upload additional context documents

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Space` | Cycle modes (Start → Pause → Hidden → Start) |
| `Ctrl+,` | Open Settings |
| `Ctrl+K` | Clear transcript |
| `Ctrl+S` | Save transcript |
| `Ctrl+E` | Export PDF |
| `Ctrl+M` | Mock Interview |
| `Ctrl+H` | History |
| `Ctrl+P` | Prep Checklist |
| `?` | Show all shortcuts |
| `Escape` | Close current panel |

## 🏗️ Tech Stack

- **Electron** — Desktop app framework
- **React** — UI (via Vite)
- **Framer Motion** — Animations
- **Web Speech API** — Browser-native speech recognition
- **OpenAI-compatible API** — LLM integration
- **jsPDF** — PDF export
- **electron-builder** — Windows installer packaging

## 📁 Project Structure

```
interview-assistant/
├── electron/          # Main process (main.js, preload.js, splash.html)
├── src/
│   ├── components/    # React components
│   │   ├── Analytics.jsx
│   │   ├── Controls.jsx
│   │   ├── History.jsx
│   │   ├── MockInterview.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Overlay.jsx
│   │   ├── PrepChecklist.jsx
│   │   ├── QuestionBank.jsx
│   │   ├── ReportCard.jsx
│   │   └── Settings.jsx
│   ├── services/      # Business logic
│   │   ├── coaching.js
│   │   ├── llm.js
│   │   ├── rag.js
│   │   ├── stt.js
│   │   └── ...
│   ├── styles/        # CSS
│   ├── App.jsx
│   └── main.jsx
├── landing/           # Landing page (deployable to Vercel)
├── build/             # App icons
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Development
```bash
npm install
npm run dev    # Starts Vite + Electron in dev mode
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for job seekers everywhere.**
