# TwinMind — Live AI Meeting Copilot

A real-time AI meeting assistant that listens to your mic, transcribes audio in chunks, and continuously surfaces contextual suggestions — questions to ask, talking points, answers, fact-checks, and clarifications — as a live conversation unfolds.

## Live Demo

> Paste your Groq API key when the popup appears and click the mic.

## Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) | API routes live alongside the UI, streaming responses are native |
| Transcription | Groq Whisper Large V3 | Fastest hosted Whisper, ~2–3s for a 30s chunk |
| LLM | Groq `llama-3.3-70b-versatile` | Best quality/speed balance on Groq; `json_object` mode for structured suggestions |
| Styling | Tailwind CSS + custom CSS | Utility classes + custom animations/glassmorphism |
| State | React `useState` + `useRef` | No external state library needed at this scale |

## Setup

```bash
cd twinmind
npm install
npm run dev
```

Open `http://localhost:3000`, paste your Groq API key in the popup, and start recording.

To get a Groq key: https://console.groq.com/keys

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Root layout, state orchestration
│   ├── layout.tsx            # HTML shell, Inter font
│   ├── globals.css           # Dark theme, animations, badge styles
│   └── api/
│       ├── transcribe/       # POST: FormData blob → Whisper → text
│       ├── suggest/          # POST: transcript + prompt → 3 JSON suggestions
│       └── chat/             # POST: messages + prompt → streaming text
├── components/
│   ├── TranscriptColumn.tsx  # Mic capture, 30s chunking, auto-scroll
│   ├── SuggestionsColumn.tsx # Auto-refresh timer, batch display
│   ├── ChatColumn.tsx        # Streaming chat, suggestion expansion
│   ├── SettingsModal.tsx     # All configurable settings
│   └── ApiKeyPopup.tsx       # First-launch onboarding popup
└── lib/
    ├── types.ts              # Shared TypeScript interfaces
    └── prompts.ts            # Default system prompts
```

## Prompt Strategy

### Live Suggestions (`/api/suggest`)

The prompt enforces **context-aware mixing** of suggestion types:

- If someone just asked a question → one suggestion must be an `Answer`
- If someone stated a claim/statistic → include a `Fact-check`
- Natural conversation → mix `Question` + `Talking Point`
- Jargon/ambiguity detected → `Clarification`

The prompt explicitly bans generic suggestions and requires previews that are *self-contained* — valuable even without clicking.

**Context window**: last 6,000 chars of transcript (configurable). Balances freshness vs. context depth.

### Detailed Answers (on suggestion click)

Uses a *separate*, longer prompt from the suggestion prompt. Pulls up to 12,000 chars of transcript. The prompt instructs the model to:
- Reference specific quotes from the transcript
- Give concrete data, examples, or action items
- Be thorough (3–5 paragraphs) but not padded

### Free-form Chat

Standard assistant prompt with full transcript injected as system context. Caps at 12,000 chars (same as detailed answers).

## Latency Optimizations

- **30s MediaRecorder intervals**: each chunk is a valid standalone `.webm` blob — no MP4/WAV conversion needed, Whisper accepts it natively
- **Echo cancellation + noise suppression**: requested via `getUserMedia` constraints to reduce noise Whisper has to filter
- **`max_tokens: 800`** for suggestions, **`2048`** for chat — avoids over-generation stalling the response
- **`temperature: 0.6`** for suggestions (focused), **`0.7`** for chat (slightly more expressive)
- **Refs for stale closure prevention**: all async callbacks read latest state via `useRef` — no unnecessary re-subscriptions

## Configurable Settings (via gear icon)

| Setting | Default | Description |
|---------|---------|-------------|
| Groq API Key | — | Your personal key, stored in localStorage |
| Refresh interval | 30s | How often transcript chunks / suggestions refresh |
| Suggestion context | 6,000 chars | How much transcript the suggestion model sees |
| Answer context | 12,000 chars | How much transcript the chat/detail model sees |
| Live suggestion prompt | (rich default) | Editable system prompt for suggestions |
| Detailed answer prompt | (rich default) | Editable prompt for suggestion click expansions |
| Chat prompt | (concise default) | Editable prompt for free-form questions |

## Export

Click the download icon (top-right of Transcript column). Exports a JSON file with:

```json
{
  "exportedAt": "ISO timestamp",
  "transcript": [{ "time": "...", "text": "..." }],
  "suggestionBatches": [{ "time": "...", "suggestions": [...] }],
  "chatHistory": [{ "time": "...", "role": "...", "content": "..." }]
}
```

## Tradeoffs

- **No VAD (Voice Activity Detection)**: silences still generate 30s chunks. Whisper handles this gracefully (returns empty or short strings), which we filter client-side (`blob.size < 1000`). A VAD library like `@ricky0123/vad-web` would be the production upgrade.
- **Client-side audio only**: no server-side recording — simpler architecture, works entirely in-browser
- **localStorage for settings**: sufficient for a single-user tool with no login requirement. A backend session would be needed for multi-tab or mobile sync.

