# World Music — 편지의 세계

> 노래를 듣는 동안 당신은 잠시 그 세계의 주민이 됩니다.  
> 노래가 끝나도, 그 세계에 머물 수 있다면.

노래에서 느끼는 세계를 **편지**로 쓰면, AI가 그 감정을 **3D 세계**로 만들어주는 웹 앱입니다.

같은 노래라도 사람마다 느끼는 세계는 다릅니다.  
그 다름을 존중하고, 가수에게 보내는 헌정이기도 합니다.

---

## How It Works

```
1. 노래를 골라 YouTube URL을 입력합니다
2. 그 노래가 안겨주는 세계를 편지로 씁니다
3. AI가 편지를 해석해 3D 세계를 만듭니다
4. 노래와 함께 가이드 여정을 떠납니다
5. 노래가 끝나면 자유롭게 세계를 탐험합니다
```

You can now choose a **World Model mode** during creation:

- **Classic**: static world (no dynamic world model)
- **Dynamic**: gradual emotional/environmental evolution over playback
- **Generative**: stronger world-model dynamics and narrative motion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| 3D | Three.js + React Three Fiber |
| AI (Letter → World) | Claude API (Anthropic) or Ollama (Qwen2.5) |
| AI (Scene Image) | Hugging Face Inference (FLUX.1-schnell by default) |
| AI (Skybox fallback) | Blockade Labs Skybox AI |
| Music | YouTube IFrame API |
| Database | SQLite + Prisma |
| Styling | Tailwind CSS |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migration
npx prisma migrate dev

# Seed demo user
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude (optional) |
| `OLLAMA_BASE_URL` | Ollama server URL (default: `http://127.0.0.1:11434`) |
| `OLLAMA_MODEL` | Ollama model for letter interpretation (default: `qwen2.5:14b`) |
| `HUGGINGFACE_API_KEY` | Hugging Face token for scene image generation |
| `HUGGINGFACE_IMAGE_MODEL` | HF image model (default: `black-forest-labs/FLUX.1-schnell`) |
| `BLOCKADE_LABS_API_KEY` | Blockade Labs key for skybox fallback (optional) |

## Project Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── page.tsx            # Landing page
│   ├── create/             # Letter editor
│   ├── world/[id]/         # 3D world experience
│   ├── gallery/            # Personal gallery
│   └── api/                # Backend API routes
├── components/
│   ├── world/              # Three.js 3D components
│   ├── youtube/            # YouTube player
│   ├── editor/             # Letter editor
│   └── gallery/            # Gallery cards
├── hooks/                  # React hooks
├── lib/                    # Core logic
│   ├── types.ts            # WorldConfig types
│   ├── ai/                 # Claude API integration
│   ├── skybox/             # Blockade Labs integration
│   └── db.ts               # Prisma client
└── __tests__/              # Vitest tests
```

## Tests

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

## World Model (Phase 2-ready)

This repo now includes a lightweight **world-model runtime layer** that lets a generated world evolve over song progress.

- `WorldConfig.world_model` is optional (backward-compatible)
- When enabled, the runtime interpolates emotional/environmental dynamics by playback progress:
  - `fog_density`
  - `wind_strength`
  - `particle_density`
  - `particle_speed`
  - `mood_intensity`
- Progression supports `linear` or `ease-in-out`
- Existing worlds without `world_model` render exactly as before

### Example `world_model`

```json
{
  "world_model": {
    "enabled": true,
    "progression": "ease-in-out",
    "dynamics": {
      "fog_density": { "from": 0.2, "to": 0.6 },
      "wind_strength": { "from": 0.1, "to": 0.3 },
      "particle_density": { "from": 0.25, "to": 0.45 },
      "particle_speed": { "from": 0.15, "to": 0.4 },
      "mood_intensity": { "from": 0.5, "to": 0.85 }
    },
    "narrative_arc": [
      "opening hush",
      "rising memory",
      "quiet release"
    ]
  }
}
```

## License

MIT
