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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| 3D | Three.js + React Three Fiber |
| AI (Letter → World) | Claude API (Anthropic) |
| AI (Skybox) | Blockade Labs Skybox AI |
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
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `BLOCKADE_LABS_API_KEY` | Blockade Labs API key for skybox generation |

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

## License

MIT
