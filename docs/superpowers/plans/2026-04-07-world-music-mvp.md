# World Music MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where users write letters about songs, and AI transforms those letters into immersive 3D worlds they can explore in the browser.

**Architecture:** Next.js App Router fullstack app. Frontend uses React Three Fiber for 3D rendering, YouTube IFrame API for music playback. Backend API routes call Claude API to interpret letters into structured World Config JSON, then Blockade Labs for skybox generation. Data persisted in SQLite via Prisma.

**Tech Stack:** Next.js 15, React Three Fiber, Three.js, Anthropic Claude API, Blockade Labs Skybox API, YouTube IFrame API, Prisma + SQLite, TypeScript, Tailwind CSS, Vitest

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with global styles
│   ├── page.tsx                      # Landing page
│   ├── create/
│   │   └── page.tsx                  # Letter editor + YouTube URL input
│   ├── world/
│   │   └── [id]/
│   │       └── page.tsx              # World experience page
│   ├── gallery/
│   │   ├── page.tsx                  # My gallery
│   │   └── [userId]/
│   │       └── page.tsx              # Public shared gallery
│   └── api/
│       ├── world/
│       │   └── generate/
│       │       └── route.ts          # POST: letter → world config → skybox → save
│       └── gallery/
│           └── route.ts              # GET: list worlds for a user
├── lib/
│   ├── types.ts                      # WorldConfig, CameraKeyframe, etc.
│   ├── ai/
│   │   ├── interpret-letter.ts       # Claude API: letter → WorldConfig JSON
│   │   └── prompts.ts                # System prompt for letter interpretation
│   ├── skybox/
│   │   └── generate-skybox.ts        # Blockade Labs API: prompt → skybox image URL
│   └── db.ts                         # Prisma client singleton
├── components/
│   ├── world/
│   │   ├── WorldScene.tsx            # R3F Canvas + scene composition
│   │   ├── Terrain.tsx               # Procedural terrain mesh
│   │   ├── Skybox.tsx                # Equirectangular skybox
│   │   ├── Particles.tsx             # Rain, snow, fireflies, etc.
│   │   ├── Atmosphere.tsx            # Fog, lighting, post-processing
│   │   ├── WorldObjects.tsx          # Trees, rocks, structures from config
│   │   └── CameraController.tsx      # Guided + free exploration modes
│   ├── youtube/
│   │   └── YouTubePlayer.tsx         # YouTube IFrame wrapper + playback state
│   ├── editor/
│   │   └── LetterEditor.tsx          # Textarea + YouTube URL input + submit
│   └── gallery/
│       ├── WorldCard.tsx             # Thumbnail card for gallery grid
│       └── WorldGrid.tsx             # Grid layout of WorldCards
├── hooks/
│   ├── useYouTubePlayer.ts           # YouTube player state management
│   └── useCameraTimeline.ts          # Interpolate camera along timeline
├── __tests__/
│   ├── lib/
│   │   ├── types.test.ts             # WorldConfig validation tests
│   │   ├── interpret-letter.test.ts  # AI pipeline tests (mocked)
│   │   └── generate-skybox.test.ts   # Skybox service tests (mocked)
│   └── hooks/
│       └── useCameraTimeline.test.ts # Camera interpolation tests
prisma/
├── schema.prisma                     # User + World models
└── seed.ts                           # Demo data for development
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `vitest.config.ts`, `prisma/schema.prisma`, `src/lib/db.ts`, `src/app/layout.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/jay/projects/World_Music
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

Select defaults when prompted. This scaffolds the Next.js project with App Router and Tailwind.

- [ ] **Step 2: Install dependencies**

```bash
npm install @react-three/fiber @react-three/drei three @anthropic-ai/sdk prisma @prisma/client
npm install -D @types/three vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 5: Define Prisma schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  worlds    World[]
  createdAt DateTime @default(now())
}

model World {
  id           String   @id @default(cuid())
  title        String
  artist       String
  youtubeUrl   String
  letter       String
  worldConfig  String
  skyboxUrl    String?
  thumbnailUrl String?
  isPublic     Boolean  @default(true)
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Note: `worldConfig` is stored as a JSON string in SQLite (SQLite has no native JSON column type). Parse with `JSON.parse()` on read.

- [ ] **Step 6: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 7: Generate Prisma client and run migration**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 8: Create .env.local template**

Create `.env.local`:

```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-key-here"
BLOCKADE_LABS_API_KEY="your-key-here"
```

Add to `.gitignore`:

```
.env.local
prisma/dev.db
prisma/dev.db-journal
.superpowers/
```

- [ ] **Step 9: Verify setup**

```bash
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Prisma, R3F, and test config"
```

---

## Task 2: WorldConfig Types and Validation

**Files:**
- Create: `src/lib/types.ts`
- Test: `src/__tests__/lib/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";

describe("parseWorldConfig", () => {
  it("parses a valid WorldConfig JSON string", () => {
    const input: WorldConfig = {
      world: {
        terrain: { type: "ocean", variation: "calm deep sea", scale: 0.7 },
        atmosphere: {
          time_of_day: "dusk",
          weather: "fog",
          fog_density: 0.6,
          wind_strength: 0.3,
        },
        palette: {
          primary: "#1a1a2e",
          secondary: "#4a4e69",
          accent: "#c9ada7",
          ambient_light: "#2a2a4a",
          directional_light: "#ffd6a5",
        },
        particles: { type: "fireflies", density: 0.4, speed: 0.2 },
        objects: [
          {
            type: "water_body",
            subtype: "still lake",
            position_hint: "center",
            scale: 0.8,
          },
        ],
        mood: {
          primary_emotion: "melancholic warmth",
          intensity: 0.6,
          description: "A quiet dusk over a still ocean, glowing softly",
        },
      },
      skybox_prompt:
        "panoramic 360 equirectangular, dusky ocean horizon, deep purple and gold sky, soft fog rolling over calm water, ethereal atmosphere",
      camera_timeline: [
        {
          timestamp_pct: 0.0,
          position: { x: 0, y: 5, z: 20 },
          look_at: { x: 0, y: 2, z: 0 },
          transition: "smooth",
          description: "Opening — distant view of the world",
        },
        {
          timestamp_pct: 1.0,
          position: { x: 0, y: 3, z: 5 },
          look_at: { x: 0, y: 1, z: -5 },
          transition: "smooth",
          description: "Ending — close and intimate",
        },
      ],
    };

    const result = parseWorldConfig(JSON.stringify(input));
    expect(result.world.terrain.type).toBe("ocean");
    expect(result.world.palette.primary).toBe("#1a1a2e");
    expect(result.camera_timeline).toHaveLength(2);
    expect(result.camera_timeline[0].timestamp_pct).toBe(0.0);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseWorldConfig("not json")).toThrow();
  });

  it("throws when required fields are missing", () => {
    expect(() => parseWorldConfig(JSON.stringify({ world: {} }))).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/types.test.ts
```

Expected: FAIL — `parseWorldConfig` not found.

- [ ] **Step 3: Implement types and parser**

Create `src/lib/types.ts`:

```typescript
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TerrainConfig {
  type:
    | "ocean"
    | "plains"
    | "mountains"
    | "forest"
    | "desert"
    | "urban"
    | "abstract"
    | "void";
  variation: string;
  scale: number;
}

export interface AtmosphereConfig {
  time_of_day:
    | "dawn"
    | "morning"
    | "afternoon"
    | "dusk"
    | "night"
    | "timeless";
  weather: "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
  fog_density: number;
  wind_strength: number;
}

export interface PaletteConfig {
  primary: string;
  secondary: string;
  accent: string;
  ambient_light: string;
  directional_light: string;
}

export interface ParticleConfig {
  type:
    | "none"
    | "rain"
    | "snow"
    | "fireflies"
    | "petals"
    | "dust"
    | "stars"
    | "embers";
  density: number;
  speed: number;
}

export interface WorldObject {
  type:
    | "tree"
    | "rock"
    | "water_body"
    | "structure"
    | "light_source"
    | "abstract_shape";
  subtype: string;
  position_hint: "center" | "scattered" | "horizon" | "overhead";
  scale: number;
}

export interface MoodConfig {
  primary_emotion: string;
  intensity: number;
  description: string;
}

export interface CameraKeyframe {
  timestamp_pct: number;
  position: Vec3;
  look_at: Vec3;
  transition: "smooth" | "cut";
  description: string;
}

export interface WorldConfig {
  world: {
    terrain: TerrainConfig;
    atmosphere: AtmosphereConfig;
    palette: PaletteConfig;
    particles: ParticleConfig;
    objects: WorldObject[];
    mood: MoodConfig;
  };
  skybox_prompt: string;
  camera_timeline: CameraKeyframe[];
}

export function parseWorldConfig(json: string): WorldConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON string");
  }

  const config = parsed as Record<string, unknown>;

  if (
    !config.world ||
    typeof config.world !== "object" ||
    !config.skybox_prompt ||
    !config.camera_timeline
  ) {
    throw new Error("Missing required fields: world, skybox_prompt, camera_timeline");
  }

  const world = config.world as Record<string, unknown>;
  if (!world.terrain || !world.atmosphere || !world.palette || !world.particles || !world.mood) {
    throw new Error("Missing required world fields: terrain, atmosphere, palette, particles, mood");
  }

  return parsed as WorldConfig;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/types.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/__tests__/lib/types.test.ts
git commit -m "feat: add WorldConfig types and parser with validation"
```

---

## Task 3: AI Pipeline — Letter Interpretation

**Files:**
- Create: `src/lib/ai/prompts.ts`, `src/lib/ai/interpret-letter.ts`
- Test: `src/__tests__/lib/interpret-letter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/interpret-letter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { interpretLetter } from "@/lib/ai/interpret-letter";

vi.mock("@anthropic-ai/sdk", () => {
  const mockResponse = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          world: {
            terrain: { type: "ocean", variation: "calm twilight sea", scale: 0.7 },
            atmosphere: {
              time_of_day: "dusk",
              weather: "fog",
              fog_density: 0.5,
              wind_strength: 0.2,
            },
            palette: {
              primary: "#1a1a2e",
              secondary: "#4a4e69",
              accent: "#c9ada7",
              ambient_light: "#2a2a4a",
              directional_light: "#ffd6a5",
            },
            particles: { type: "fireflies", density: 0.3, speed: 0.2 },
            objects: [
              {
                type: "water_body",
                subtype: "calm ocean",
                position_hint: "center",
                scale: 0.9,
              },
            ],
            mood: {
              primary_emotion: "bittersweet longing",
              intensity: 0.7,
              description: "A quiet twilight world where waves whisper memories",
            },
          },
          skybox_prompt:
            "360 equirectangular panorama, twilight ocean, purple gold sky, soft fog, ethereal",
          camera_timeline: [
            {
              timestamp_pct: 0.0,
              position: { x: 0, y: 5, z: 20 },
              look_at: { x: 0, y: 2, z: 0 },
              transition: "smooth",
              description: "Opening vista",
            },
            {
              timestamp_pct: 1.0,
              position: { x: 0, y: 3, z: 5 },
              look_at: { x: 0, y: 1, z: -5 },
              transition: "smooth",
              description: "Closing intimacy",
            },
          ],
        }),
      },
    ],
  };

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue(mockResponse),
      },
    })),
  };
});

describe("interpretLetter", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("converts a letter into a valid WorldConfig", async () => {
    const result = await interpretLetter({
      letter: "따뜻하면서도 쓸쓸한, 황혼의 바다 위에 서 있는 느낌",
      songTitle: "Sunset",
      artist: "Dream Artist",
    });

    expect(result.world.terrain.type).toBe("ocean");
    expect(result.world.mood.primary_emotion).toBe("bittersweet longing");
    expect(result.skybox_prompt).toContain("equirectangular");
    expect(result.camera_timeline.length).toBeGreaterThanOrEqual(2);
    expect(result.camera_timeline[0].timestamp_pct).toBe(0.0);
    expect(result.camera_timeline.at(-1)!.timestamp_pct).toBe(1.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/interpret-letter.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the system prompt**

Create `src/lib/ai/prompts.ts`:

```typescript
export const LETTER_INTERPRETATION_PROMPT = `You are a world architect. You receive a personal letter that describes how someone feels when listening to a specific song. Your job is to translate that emotional landscape into a structured 3D world specification.

The letter expresses feelings, moods, and atmospheres — not literal scene descriptions. You must interpret these abstract emotions into concrete visual elements: terrain, weather, lighting, colors, particles, and objects that evoke the same feeling.

OUTPUT FORMAT: Respond with ONLY valid JSON matching this structure (no markdown, no explanation):

{
  "world": {
    "terrain": {
      "type": "ocean" | "plains" | "mountains" | "forest" | "desert" | "urban" | "abstract" | "void",
      "variation": "free text describing the specific look of the terrain",
      "scale": 0.0-1.0
    },
    "atmosphere": {
      "time_of_day": "dawn" | "morning" | "afternoon" | "dusk" | "night" | "timeless",
      "weather": "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm",
      "fog_density": 0.0-1.0,
      "wind_strength": 0.0-1.0
    },
    "palette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "ambient_light": "#hex",
      "directional_light": "#hex"
    },
    "particles": {
      "type": "none" | "rain" | "snow" | "fireflies" | "petals" | "dust" | "stars" | "embers",
      "density": 0.0-1.0,
      "speed": 0.0-1.0
    },
    "objects": [
      {
        "type": "tree" | "rock" | "water_body" | "structure" | "light_source" | "abstract_shape",
        "subtype": "free text description",
        "position_hint": "center" | "scattered" | "horizon" | "overhead",
        "scale": 0.0-1.0
      }
    ],
    "mood": {
      "primary_emotion": "string",
      "intensity": 0.0-1.0,
      "description": "one sentence summary of this world"
    }
  },
  "skybox_prompt": "English prompt for 360 equirectangular panorama image generation. Must start with '360 equirectangular panorama'. Describe the sky, horizon, and distant background that wraps around the entire world.",
  "camera_timeline": [
    {
      "timestamp_pct": 0.0,
      "position": { "x": number, "y": number, "z": number },
      "look_at": { "x": number, "y": number, "z": number },
      "transition": "smooth",
      "description": "what this moment represents emotionally"
    }
  ]
}

RULES:
- camera_timeline must have at least 4 keyframes at timestamp_pct: 0.0, ~0.25, ~0.5, 1.0
- First keyframe should be a distant establishing shot (high y, far z)
- Middle keyframes should bring the viewer into the world
- Last keyframe timestamp_pct must be exactly 1.0
- Camera y should never go below 1.0 (ground level)
- The world should feel like a place you could wander in, not a flat image
- Match the emotional tone of the letter, not literal content
- palette colors should be cohesive and evoke the mood
- skybox_prompt should create a seamless 360 environment`;
```

- [ ] **Step 4: Implement the letter interpretation function**

Create `src/lib/ai/interpret-letter.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { parseWorldConfig, type WorldConfig } from "@/lib/types";
import { LETTER_INTERPRETATION_PROMPT } from "./prompts";

interface LetterInput {
  letter: string;
  songTitle: string;
  artist: string;
}

export async function interpretLetter(input: LetterInput): Promise<WorldConfig> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: LETTER_INTERPRETATION_PROMPT,
    messages: [
      {
        role: "user",
        content: `Song: "${input.songTitle}" by ${input.artist}\n\nLetter:\n${input.letter}`,
      },
    ],
  });

  const text = response.content[0];
  if (text.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return parseWorldConfig(text.text);
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/interpret-letter.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/ src/__tests__/lib/interpret-letter.test.ts
git commit -m "feat: add AI letter interpretation pipeline with Claude API"
```

---

## Task 4: Skybox Generation Service

**Files:**
- Create: `src/lib/skybox/generate-skybox.ts`
- Test: `src/__tests__/lib/generate-skybox.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/generate-skybox.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSkybox } from "@/lib/skybox/generate-skybox";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("generateSkybox", () => {
  beforeEach(() => {
    vi.stubEnv("BLOCKADE_LABS_API_KEY", "test-key");
    mockFetch.mockReset();
  });

  it("returns a skybox image URL from a prompt", async () => {
    // First call: create generation request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "gen-123" }),
    });
    // Second call: poll for completion
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "complete",
        file_url: "https://skybox.blockadelabs.com/result-123.jpg",
      }),
    });

    const url = await generateSkybox(
      "360 equirectangular panorama, twilight ocean, purple sky"
    );

    expect(url).toBe("https://skybox.blockadelabs.com/result-123.jpg");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    await expect(
      generateSkybox("test prompt")
    ).rejects.toThrow("Skybox API error: 401");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/lib/generate-skybox.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement skybox generation**

Create `src/lib/skybox/generate-skybox.ts`:

```typescript
const BLOCKADE_API_BASE = "https://backend.blockadelabs.com/api/v1";

async function pollForCompletion(
  id: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${BLOCKADE_API_BASE}/imagine/requests/${id}?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`Skybox API error: ${res.status}`);

    const data = await res.json();

    if (data.status === "complete") {
      return data.file_url;
    }
    if (data.status === "error") {
      throw new Error(`Skybox generation failed: ${data.error_message || "unknown"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Skybox generation timed out");
}

export async function generateSkybox(prompt: string): Promise<string> {
  const apiKey = process.env.BLOCKADE_LABS_API_KEY;
  if (!apiKey) throw new Error("BLOCKADE_LABS_API_KEY not set");

  const res = await fetch(`${BLOCKADE_API_BASE}/imagine/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      generator: "stable-skybox",
      prompt,
    }),
  });

  if (!res.ok) throw new Error(`Skybox API error: ${res.status}`);

  const data = await res.json();
  return pollForCompletion(data.id, apiKey);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/lib/generate-skybox.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/skybox/ src/__tests__/lib/generate-skybox.test.ts
git commit -m "feat: add Blockade Labs skybox generation service"
```

---

## Task 5: Camera Timeline Interpolation Hook

**Files:**
- Create: `src/hooks/useCameraTimeline.ts`
- Test: `src/__tests__/hooks/useCameraTimeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/hooks/useCameraTimeline.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { interpolateTimeline } from "@/hooks/useCameraTimeline";
import type { CameraKeyframe } from "@/lib/types";

const timeline: CameraKeyframe[] = [
  {
    timestamp_pct: 0.0,
    position: { x: 0, y: 10, z: 20 },
    look_at: { x: 0, y: 2, z: 0 },
    transition: "smooth",
    description: "start",
  },
  {
    timestamp_pct: 0.5,
    position: { x: 0, y: 5, z: 10 },
    look_at: { x: 0, y: 1, z: -5 },
    transition: "smooth",
    description: "middle",
  },
  {
    timestamp_pct: 1.0,
    position: { x: 0, y: 3, z: 5 },
    look_at: { x: 0, y: 1, z: -10 },
    transition: "smooth",
    description: "end",
  },
];

describe("interpolateTimeline", () => {
  it("returns first keyframe at t=0", () => {
    const result = interpolateTimeline(timeline, 0.0);
    expect(result.position).toEqual({ x: 0, y: 10, z: 20 });
    expect(result.look_at).toEqual({ x: 0, y: 2, z: 0 });
  });

  it("returns last keyframe at t=1", () => {
    const result = interpolateTimeline(timeline, 1.0);
    expect(result.position).toEqual({ x: 0, y: 3, z: 5 });
  });

  it("interpolates midpoint between keyframes", () => {
    const result = interpolateTimeline(timeline, 0.25);
    // Halfway between keyframe 0 and keyframe 1
    expect(result.position.y).toBeCloseTo(7.5, 1);
    expect(result.position.z).toBeCloseTo(15, 1);
  });

  it("clamps below 0", () => {
    const result = interpolateTimeline(timeline, -0.5);
    expect(result.position).toEqual({ x: 0, y: 10, z: 20 });
  });

  it("clamps above 1", () => {
    const result = interpolateTimeline(timeline, 1.5);
    expect(result.position).toEqual({ x: 0, y: 3, z: 5 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/hooks/useCameraTimeline.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement interpolation logic**

Create `src/hooks/useCameraTimeline.ts`:

```typescript
"use client";

import { useCallback } from "react";
import type { CameraKeyframe, Vec3 } from "@/lib/types";

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export interface InterpolatedCamera {
  position: Vec3;
  look_at: Vec3;
}

export function interpolateTimeline(
  timeline: CameraKeyframe[],
  t: number
): InterpolatedCamera {
  const clamped = Math.max(0, Math.min(1, t));

  if (clamped <= timeline[0].timestamp_pct) {
    return { position: timeline[0].position, look_at: timeline[0].look_at };
  }

  const last = timeline[timeline.length - 1];
  if (clamped >= last.timestamp_pct) {
    return { position: last.position, look_at: last.look_at };
  }

  // Find the two keyframes we're between
  let i = 0;
  while (i < timeline.length - 1 && timeline[i + 1].timestamp_pct <= clamped) {
    i++;
  }

  const from = timeline[i];
  const to = timeline[i + 1];
  const segmentT =
    (clamped - from.timestamp_pct) / (to.timestamp_pct - from.timestamp_pct);

  return {
    position: lerpVec3(from.position, to.position, segmentT),
    look_at: lerpVec3(from.look_at, to.look_at, segmentT),
  };
}

export function useCameraTimeline(timeline: CameraKeyframe[]) {
  const getCamera = useCallback(
    (t: number) => interpolateTimeline(timeline, t),
    [timeline]
  );

  return { getCamera };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/hooks/useCameraTimeline.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCameraTimeline.ts src/__tests__/hooks/useCameraTimeline.test.ts
git commit -m "feat: add camera timeline interpolation hook"
```

---

## Task 6: Three.js World Components

**Files:**
- Create: `src/components/world/WorldScene.tsx`, `src/components/world/Terrain.tsx`, `src/components/world/Skybox.tsx`, `src/components/world/Particles.tsx`, `src/components/world/Atmosphere.tsx`, `src/components/world/WorldObjects.tsx`, `src/components/world/CameraController.tsx`

This task creates the visual 3D components. These are tested visually rather than with unit tests.

- [ ] **Step 1: Create Terrain component**

Create `src/components/world/Terrain.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { TerrainConfig, PaletteConfig } from "@/lib/types";

interface TerrainProps {
  terrain: TerrainConfig;
  palette: PaletteConfig;
}

export function Terrain({ terrain, palette }: TerrainProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 128, 128);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);

      let height = 0;
      const scale = terrain.scale;

      switch (terrain.type) {
        case "ocean":
          height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * scale * 0.5;
          break;
        case "mountains":
          height =
            (Math.sin(x * 0.02) * Math.cos(z * 0.03) +
              Math.sin(x * 0.05 + 1) * 0.5) *
            scale *
            15;
          break;
        case "plains":
          height =
            Math.sin(x * 0.01) * Math.cos(z * 0.01) * scale * 2;
          break;
        case "forest":
          height =
            (Math.sin(x * 0.03) * Math.cos(z * 0.02) +
              Math.random() * 0.1) *
            scale *
            3;
          break;
        case "desert":
          height =
            Math.abs(Math.sin(x * 0.04) * Math.cos(z * 0.04)) * scale * 5;
          break;
        default:
          height = 0;
      }

      positions.setZ(i, height);
    }

    geo.computeVertexNormals();
    return geo;
  }, [terrain.type, terrain.scale]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        color={palette.primary}
        roughness={0.8}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Create Skybox component**

Create `src/components/world/Skybox.tsx`:

```tsx
"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

interface SkyboxProps {
  url: string | null;
  fallbackColor: string;
}

export function Skybox({ url, fallbackColor }: SkyboxProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (url) {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
      });
    } else {
      scene.background = new THREE.Color(fallbackColor);
    }

    return () => {
      scene.background = null;
    };
  }, [url, fallbackColor, scene]);

  return null;
}
```

- [ ] **Step 3: Create Particles component**

Create `src/components/world/Particles.tsx`:

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ParticleConfig, PaletteConfig } from "@/lib/types";

interface ParticlesProps {
  config: ParticleConfig;
  palette: PaletteConfig;
}

const PARTICLE_COUNT = 2000;

export function Particles({ config, palette }: ParticlesProps) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, []);

  const particleColor = useMemo(() => {
    switch (config.type) {
      case "rain":
        return "#aaccff";
      case "snow":
        return "#ffffff";
      case "fireflies":
        return "#ffee88";
      case "petals":
        return palette.accent;
      case "dust":
        return "#ccbbaa";
      case "stars":
        return "#ffffff";
      case "embers":
        return "#ff6633";
      default:
        return "#ffffff";
    }
  }, [config.type, palette.accent]);

  const particleSize = useMemo(() => {
    switch (config.type) {
      case "rain":
        return 0.05;
      case "snow":
        return 0.15;
      case "fireflies":
        return 0.2;
      case "petals":
        return 0.2;
      case "stars":
        return 0.1;
      default:
        return 0.1;
    }
  }, [config.type]);

  useFrame((_, delta) => {
    if (!ref.current || config.type === "none") return;
    const pos = ref.current.geometry.attributes.position;
    const speed = config.speed * delta * 10;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = pos.getY(i);

      switch (config.type) {
        case "rain":
          pos.setY(i, y - speed * 5);
          if (y < 0) pos.setY(i, 50);
          break;
        case "snow":
          pos.setY(i, y - speed);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i) * 0.01);
          if (y < 0) pos.setY(i, 50);
          break;
        case "fireflies":
          pos.setY(i, y + Math.sin(Date.now() * 0.002 + i) * 0.02);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i * 0.5) * 0.01);
          break;
        case "petals":
          pos.setY(i, y - speed * 0.5);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.001 + i) * 0.02);
          if (y < 0) pos.setY(i, 30);
          break;
        case "embers":
          pos.setY(i, y + speed * 2);
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.003 + i) * 0.01);
          if (y > 50) pos.setY(i, 0);
          break;
        case "stars":
          // Stars don't move, just twinkle (handled by opacity in material)
          break;
        case "dust":
          pos.setX(i, pos.getX(i) + Math.sin(Date.now() * 0.0005 + i) * 0.005);
          pos.setY(i, y + Math.sin(Date.now() * 0.001 + i * 0.3) * 0.005);
          break;
      }
    }
    pos.needsUpdate = true;
  });

  if (config.type === "none") return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        color={particleColor}
        transparent
        opacity={config.density}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
```

- [ ] **Step 4: Create Atmosphere component**

Create `src/components/world/Atmosphere.tsx`:

```tsx
"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import type { AtmosphereConfig, PaletteConfig } from "@/lib/types";

interface AtmosphereProps {
  atmosphere: AtmosphereConfig;
  palette: PaletteConfig;
}

export function Atmosphere({ atmosphere, palette }: AtmosphereProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (atmosphere.fog_density > 0) {
      scene.fog = new THREE.FogExp2(palette.primary, atmosphere.fog_density * 0.05);
    } else {
      scene.fog = null;
    }
    return () => {
      scene.fog = null;
    };
  }, [atmosphere.fog_density, palette.primary, scene]);

  const ambientIntensity = (() => {
    switch (atmosphere.time_of_day) {
      case "night":
        return 0.2;
      case "dusk":
      case "dawn":
        return 0.4;
      default:
        return 0.6;
    }
  })();

  const directionalIntensity = (() => {
    switch (atmosphere.time_of_day) {
      case "night":
        return 0.3;
      case "dusk":
      case "dawn":
        return 0.7;
      default:
        return 1.0;
    }
  })();

  const sunPosition: [number, number, number] = (() => {
    switch (atmosphere.time_of_day) {
      case "dawn":
        return [50, 10, 0];
      case "morning":
        return [50, 30, 20];
      case "afternoon":
        return [0, 50, -20];
      case "dusk":
        return [-50, 10, 0];
      case "night":
        return [0, -10, 0];
      case "timeless":
        return [0, 50, 0];
      default:
        return [0, 50, 0];
    }
  })();

  return (
    <>
      <ambientLight color={palette.ambient_light} intensity={ambientIntensity} />
      <directionalLight
        color={palette.directional_light}
        intensity={directionalIntensity}
        position={sunPosition}
        castShadow
      />
    </>
  );
}
```

- [ ] **Step 5: Create WorldObjects component**

Create `src/components/world/WorldObjects.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { WorldObject, PaletteConfig } from "@/lib/types";

interface WorldObjectsProps {
  objects: WorldObject[];
  palette: PaletteConfig;
}

function ObjectMesh({
  obj,
  palette,
  index,
}: {
  obj: WorldObject;
  palette: PaletteConfig;
  index: number;
}) {
  const position = useMemo((): [number, number, number] => {
    const spread = 30;
    switch (obj.position_hint) {
      case "center":
        return [0, obj.scale * 2, 0];
      case "horizon":
        return [
          Math.cos(index * 1.5) * 50,
          obj.scale * 2,
          Math.sin(index * 1.5) * 50,
        ];
      case "overhead":
        return [
          (Math.random() - 0.5) * 20,
          15 + obj.scale * 5,
          (Math.random() - 0.5) * 20,
        ];
      case "scattered":
      default:
        return [
          Math.cos(index * 2.4) * spread * Math.random(),
          obj.scale,
          Math.sin(index * 2.4) * spread * Math.random(),
        ];
    }
  }, [obj.position_hint, obj.scale, index]);

  const geometry = useMemo(() => {
    switch (obj.type) {
      case "tree":
        return new THREE.ConeGeometry(obj.scale * 2, obj.scale * 6, 6);
      case "rock":
        return new THREE.DodecahedronGeometry(obj.scale * 2, 0);
      case "structure":
        return new THREE.BoxGeometry(
          obj.scale * 4,
          obj.scale * 6,
          obj.scale * 4
        );
      case "light_source":
        return new THREE.SphereGeometry(obj.scale, 16, 16);
      case "abstract_shape":
        return new THREE.TorusKnotGeometry(obj.scale * 2, 0.5, 64, 8);
      case "water_body":
        return new THREE.CircleGeometry(obj.scale * 15, 32);
      default:
        return new THREE.SphereGeometry(obj.scale, 8, 8);
    }
  }, [obj.type, obj.scale]);

  const color = useMemo(() => {
    switch (obj.type) {
      case "tree":
        return "#2d5a27";
      case "rock":
        return "#666666";
      case "light_source":
        return palette.accent;
      case "water_body":
        return palette.secondary;
      default:
        return palette.primary;
    }
  }, [obj.type, palette]);

  const rotation: [number, number, number] =
    obj.type === "water_body" ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <primitive object={geometry} />
      <meshStandardMaterial
        color={color}
        roughness={obj.type === "light_source" ? 0.2 : 0.7}
        metalness={obj.type === "light_source" ? 0.8 : 0.1}
        emissive={obj.type === "light_source" ? palette.accent : "#000000"}
        emissiveIntensity={obj.type === "light_source" ? 0.5 : 0}
        transparent={obj.type === "water_body"}
        opacity={obj.type === "water_body" ? 0.6 : 1}
      />
    </mesh>
  );
}

export function WorldObjects({ objects, palette }: WorldObjectsProps) {
  return (
    <>
      {objects.map((obj, i) => (
        <ObjectMesh key={i} obj={obj} palette={palette} index={i} />
      ))}
    </>
  );
}
```

- [ ] **Step 6: Create CameraController component**

Create `src/components/world/CameraController.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  interpolateTimeline,
  type InterpolatedCamera,
} from "@/hooks/useCameraTimeline";
import type { CameraKeyframe } from "@/lib/types";

interface CameraControllerProps {
  timeline: CameraKeyframe[];
  progress: number; // 0.0 - 1.0
  mode: "guided" | "free";
}

export function CameraController({
  timeline,
  progress,
  mode,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef = useRef<InterpolatedCamera | null>(null);

  useFrame(() => {
    if (mode !== "guided") return;

    const target = interpolateTimeline(timeline, progress);
    targetRef.current = target;

    // Smooth lerp toward target position
    camera.position.lerp(
      new THREE.Vector3(target.position.x, target.position.y, target.position.z),
      0.03
    );

    const lookTarget = new THREE.Vector3(
      target.look_at.x,
      target.look_at.y,
      target.look_at.z
    );
    camera.lookAt(lookTarget);
  });

  if (mode === "free") {
    return (
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI * 0.85}
        minDistance={2}
        maxDistance={100}
      />
    );
  }

  return null;
}
```

- [ ] **Step 7: Create WorldScene composition**

Create `src/components/world/WorldScene.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import type { WorldConfig } from "@/lib/types";
import { Terrain } from "./Terrain";
import { Skybox } from "./Skybox";
import { Particles } from "./Particles";
import { Atmosphere } from "./Atmosphere";
import { WorldObjects } from "./WorldObjects";
import { CameraController } from "./CameraController";

interface WorldSceneProps {
  config: WorldConfig;
  skyboxUrl: string | null;
  progress: number;
  mode: "guided" | "free";
}

export function WorldScene({
  config,
  skyboxUrl,
  progress,
  mode,
}: WorldSceneProps) {
  const { world } = config;

  return (
    <Canvas
      camera={{ position: [0, 10, 20], fov: 60, near: 0.1, far: 500 }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <Skybox url={skyboxUrl} fallbackColor={world.palette.primary} />
      <Atmosphere atmosphere={world.atmosphere} palette={world.palette} />
      <Terrain terrain={world.terrain} palette={world.palette} />
      <WorldObjects objects={world.objects} palette={world.palette} />
      <Particles config={world.particles} palette={world.palette} />
      <CameraController
        timeline={config.camera_timeline}
        progress={progress}
        mode={mode}
      />
    </Canvas>
  );
}
```

- [ ] **Step 8: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds (components aren't rendered yet, but TypeScript should compile).

- [ ] **Step 9: Commit**

```bash
git add src/components/world/
git commit -m "feat: add Three.js world rendering components

Terrain, skybox, particles, atmosphere, world objects, and camera
controller with guided/free modes."
```

---

## Task 7: YouTube Player Component and Hook

**Files:**
- Create: `src/hooks/useYouTubePlayer.ts`, `src/components/youtube/YouTubePlayer.tsx`

- [ ] **Step 1: Create YouTube player hook**

Create `src/hooks/useYouTubePlayer.ts`:

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: YTEvent) => void>;
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTEvent {
  data: number;
  target: YTPlayer;
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export type PlayerState = "loading" | "ready" | "playing" | "paused" | "ended" | "error";

export function useYouTubePlayer(elementId: string) {
  const [state, setState] = useState<PlayerState>("loading");
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVideo = useCallback(
    (videoId: string) => {
      // Load YouTube IFrame API script if not already loaded
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
          createPlayer(videoId);
        };
      } else {
        createPlayer(videoId);
      }

      function createPlayer(vid: string) {
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player(elementId, {
          videoId: vid,
          playerVars: { autoplay: 0, controls: 1, modestbranding: 1 },
          events: {
            onReady: () => setState("ready"),
            onStateChange: (event: YTEvent) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  setState("playing");
                  startProgressTracking();
                  break;
                case window.YT.PlayerState.PAUSED:
                  setState("paused");
                  stopProgressTracking();
                  break;
                case window.YT.PlayerState.ENDED:
                  setState("ended");
                  setProgress(1.0);
                  stopProgressTracking();
                  break;
              }
            },
            onError: () => setState("error"),
          },
        });
      }
    },
    [elementId]
  );

  function startProgressTracking() {
    stopProgressTracking();
    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress(current / duration);
        }
      }
    }, 100);
  }

  function stopProgressTracking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return { state, progress, loadVideo };
}
```

- [ ] **Step 2: Create YouTubePlayer component**

Create `src/components/youtube/YouTubePlayer.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useYouTubePlayer, type PlayerState } from "@/hooks/useYouTubePlayer";

interface YouTubePlayerProps {
  videoId: string;
  onProgressChange: (progress: number) => void;
  onStateChange: (state: PlayerState) => void;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function YouTubePlayer({
  videoId,
  onProgressChange,
  onStateChange,
}: YouTubePlayerProps) {
  const { state, progress, loadVideo } = useYouTubePlayer("yt-player");

  useEffect(() => {
    loadVideo(videoId);
  }, [videoId, loadVideo]);

  useEffect(() => {
    onProgressChange(progress);
  }, [progress, onProgressChange]);

  useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  return (
    <div className="w-full">
      <div
        id="yt-player"
        className="w-full aspect-video rounded-lg overflow-hidden"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useYouTubePlayer.ts src/components/youtube/
git commit -m "feat: add YouTube player component with progress tracking"
```

---

## Task 8: World Generation API Route

**Files:**
- Create: `src/app/api/world/generate/route.ts`

- [ ] **Step 1: Create the API route**

Create `src/app/api/world/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { interpretLetter } from "@/lib/ai/interpret-letter";
import { generateSkybox } from "@/lib/skybox/generate-skybox";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { letter, songTitle, artist, youtubeUrl, userId } = body;

    if (!letter || !songTitle || !artist || !youtubeUrl || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: letter, songTitle, artist, youtubeUrl, userId" },
        { status: 400 }
      );
    }

    // Step 1: Interpret letter with Claude
    const worldConfig = await interpretLetter({ letter, songTitle, artist });

    // Step 2: Generate skybox (non-blocking — save URL later if it fails)
    let skyboxUrl: string | null = null;
    try {
      skyboxUrl = await generateSkybox(worldConfig.skybox_prompt);
    } catch (err) {
      console.error("Skybox generation failed, continuing without:", err);
    }

    // Step 3: Save to database
    const world = await prisma.world.create({
      data: {
        title: songTitle,
        artist,
        youtubeUrl,
        letter,
        worldConfig: JSON.stringify(worldConfig),
        skyboxUrl,
        userId,
      },
    });

    return NextResponse.json({
      id: world.id,
      worldConfig,
      skyboxUrl,
    });
  } catch (err) {
    console.error("World generation failed:", err);
    return NextResponse.json(
      { error: "World generation failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create gallery API route**

Create `src/app/api/gallery/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const worlds = await prisma.world.findMany({
    where: { userId, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      artist: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ worlds });
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add world generation and gallery API routes"
```

---

## Task 9: Create Page (Letter Editor)

**Files:**
- Create: `src/components/editor/LetterEditor.tsx`, `src/app/create/page.tsx`

- [ ] **Step 1: Create LetterEditor component**

Create `src/components/editor/LetterEditor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { extractVideoId } from "@/components/youtube/YouTubePlayer";

interface LetterEditorProps {
  onSubmit: (data: {
    letter: string;
    songTitle: string;
    artist: string;
    youtubeUrl: string;
  }) => void;
  isLoading: boolean;
}

export function LetterEditor({ onSubmit, isLoading }: LetterEditorProps) {
  const [letter, setLetter] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError("올바른 YouTube URL을 입력해주세요");
      return;
    }
    setUrlError("");

    onSubmit({ letter, songTitle, artist, youtubeUrl });
  }

  const isValid = letter.trim() && songTitle.trim() && artist.trim() && youtubeUrl.trim();

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            노래 제목
          </label>
          <input
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="노래 제목을 입력하세요"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            아티스트
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="아티스트 이름을 입력하세요"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            YouTube URL
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => {
              setYoutubeUrl(e.target.value);
              setUrlError("");
            }}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {urlError && (
            <p className="mt-1 text-sm text-red-400">{urlError}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          편지
        </label>
        <p className="text-xs text-gray-500 mb-2">
          이 노래가 안겨주는 세계를 자유롭게 묘사해보세요. 느끼는 분위기, 감정, 풍경...
        </p>
        <textarea
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          placeholder="이 노래를 들으면 떠오르는 세계를 편지로 써보세요..."
          rows={10}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? "세계를 만들고 있습니다..." : "세계 만들기"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create the /create page**

Create `src/app/create/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LetterEditor } from "@/components/editor/LetterEditor";

export default function CreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: {
    letter: string;
    songTitle: string;
    artist: string;
    youtubeUrl: string;
  }) {
    setIsLoading(true);
    setError("");

    try {
      // TODO: Replace with real user ID when auth is added
      const userId = "demo-user";

      const res = await fetch("/api/world/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세계 생성에 실패했습니다");
      }

      const result = await res.json();
      router.push(`/world/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">세계 만들기</h1>
          <p className="text-gray-400">
            노래에서 느끼는 세계를 편지로 써보세요
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <LetterEditor onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/ src/app/create/
git commit -m "feat: add letter editor and create page"
```

---

## Task 10: World Experience Page

**Files:**
- Create: `src/app/world/[id]/page.tsx`

- [ ] **Step 1: Create the world experience page**

Create `src/app/world/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { WorldScene } from "@/components/world/WorldScene";
import {
  YouTubePlayer,
  extractVideoId,
} from "@/components/youtube/YouTubePlayer";
import type { WorldConfig } from "@/lib/types";
import { parseWorldConfig } from "@/lib/types";
import type { PlayerState } from "@/hooks/useYouTubePlayer";

interface WorldData {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string;
  letter: string;
  worldConfig: string;
  skyboxUrl: string | null;
}

export default function WorldPage() {
  const params = useParams();
  const id = params.id as string;

  const [world, setWorld] = useState<WorldData | null>(null);
  const [config, setConfig] = useState<WorldConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [mode, setMode] = useState<"guided" | "free">("guided");
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    async function loadWorld() {
      try {
        const res = await fetch(`/api/world/${id}`);
        if (!res.ok) throw new Error("세계를 찾을 수 없습니다");
        const data = await res.json();
        setWorld(data);
        setConfig(parseWorldConfig(data.worldConfig));
      } catch (err) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    }
    loadWorld();
  }, [id]);

  const handleProgressChange = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleStateChange = useCallback((state: PlayerState) => {
    setPlayerState(state);
    if (state === "ended") {
      setMode("free");
      setShowUI(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-4">세계를 여는 중...</div>
        </div>
      </div>
    );
  }

  if (error || !world || !config) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        {error || "세계를 찾을 수 없습니다"}
      </div>
    );
  }

  const videoId = extractVideoId(world.youtubeUrl);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* 3D World */}
      <div className="absolute inset-0">
        <WorldScene
          config={config}
          skyboxUrl={world.skyboxUrl}
          progress={progress}
          mode={mode}
        />
      </div>

      {/* UI Overlay */}
      {showUI && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-md mx-auto space-y-3">
            {/* Song info */}
            <div className="text-center text-white">
              <p className="text-lg font-medium">{world.title}</p>
              <p className="text-sm text-gray-400">{world.artist}</p>
            </div>

            {/* YouTube Player */}
            {videoId && (
              <div className="w-full max-w-sm mx-auto opacity-90">
                <YouTubePlayer
                  videoId={videoId}
                  onProgressChange={handleProgressChange}
                  onStateChange={handleStateChange}
                />
              </div>
            )}

            {/* Mode indicator */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setMode("guided")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === "guided"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                가이드 여정
              </button>
              <button
                onClick={() => setMode("free")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === "free"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                자유 탐험
              </button>
              <button
                onClick={() => setShowUI(false)}
                className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-400 hover:bg-gray-700"
              >
                UI 숨기기
              </button>
            </div>

            {/* Mood description */}
            <p className="text-center text-xs text-gray-500 italic">
              {config.world.mood.description}
            </p>
          </div>
        </div>
      )}

      {/* Hidden UI toggle */}
      {!showUI && (
        <button
          onClick={() => setShowUI(true)}
          className="absolute bottom-4 right-4 px-3 py-1 rounded bg-black/50 text-gray-400 text-sm hover:bg-black/70"
        >
          UI 보기
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the world detail API route**

Create `src/app/api/world/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const world = await prisma.world.findUnique({
    where: { id },
  });

  if (!world) {
    return NextResponse.json({ error: "World not found" }, { status: 404 });
  }

  return NextResponse.json(world);
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/world/ src/app/api/world/
git commit -m "feat: add world experience page with 3D viewer and YouTube sync"
```

---

## Task 11: Gallery Pages

**Files:**
- Create: `src/components/gallery/WorldCard.tsx`, `src/components/gallery/WorldGrid.tsx`, `src/app/gallery/page.tsx`, `src/app/gallery/[userId]/page.tsx`

- [ ] **Step 1: Create WorldCard component**

Create `src/components/gallery/WorldCard.tsx`:

```tsx
import Link from "next/link";

interface WorldCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export function WorldCard({
  id,
  title,
  artist,
  thumbnailUrl,
  createdAt,
}: WorldCardProps) {
  return (
    <Link href={`/world/${id}`}>
      <div className="group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-600 transition-colors">
        <div className="aspect-video bg-gray-800 relative overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <span className="text-4xl">🌍</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-white truncate">{title}</h3>
          <p className="text-sm text-gray-400 truncate">{artist}</p>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create WorldGrid component**

Create `src/components/gallery/WorldGrid.tsx`:

```tsx
import { WorldCard } from "./WorldCard";

interface World {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

interface WorldGridProps {
  worlds: World[];
  emptyMessage?: string;
}

export function WorldGrid({
  worlds,
  emptyMessage = "아직 만든 세계가 없습니다",
}: WorldGridProps) {
  if (worlds.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-4">🌑</p>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {worlds.map((world) => (
        <WorldCard key={world.id} {...world} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create my gallery page**

Create `src/app/gallery/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WorldGrid } from "@/components/gallery/WorldGrid";

interface World {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real user ID when auth is added
    const userId = "demo-user";
    fetch(`/api/gallery?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setWorlds(data.worlds))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">내 세계</h1>
          <Link
            href="/create"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            새 세계 만들기
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">
            로딩 중...
          </div>
        ) : (
          <WorldGrid worlds={worlds} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create shared gallery page**

Create `src/app/gallery/[userId]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorldGrid } from "@/components/gallery/WorldGrid";

interface World {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
  createdAt: string;
}

export default function SharedGalleryPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gallery?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setWorlds(data.worlds))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">갤러리</h1>

        {loading ? (
          <div className="text-center py-16 text-gray-500 animate-pulse">
            로딩 중...
          </div>
        ) : (
          <WorldGrid
            worlds={worlds}
            emptyMessage="이 갤러리에는 아직 세계가 없습니다"
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify it compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/gallery/ src/app/gallery/
git commit -m "feat: add gallery pages with world cards grid"
```

---

## Task 12: Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Music — 편지의 세계",
  description: "노래에서 느끼는 세계를 편지로 쓰면, AI가 3D 세계로 만들어줍니다",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-900">
        <span className="text-lg font-bold">World Music</span>
        <Link
          href="/gallery"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          내 갤러리
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            노래의 세계에
            <br />
            <span className="text-purple-400">머물다</span>
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            노래를 듣는 동안 당신은 잠시 그 세계의 주민이 됩니다.
            <br />
            편지를 쓰면, AI가 당신만의 세계를 만들어줍니다.
          </p>
          <Link
            href="/create"
            className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-medium transition-colors"
          >
            세계 만들기
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-700">
        같은 노래, 다른 세계. 그 다름을 존중합니다.
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles and runs**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add landing page and update root layout"
```

---

## Task 13: Seed Data and Demo User

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: "demo-user" },
    update: {},
    create: {
      id: "demo-user",
      name: "Demo User",
    },
  });

  console.log("Seeded demo user:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:

```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Install tsx:

```bash
npm install -D tsx
```

- [ ] **Step 3: Run the seed**

```bash
npx prisma db seed
```

Expected: "Seeded demo user: demo-user"

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add seed script with demo user"
```

---

## Task 14: Run All Tests and Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass (types, interpret-letter, generate-skybox, useCameraTimeline).

- [ ] **Step 2: Run dev server and smoke test**

```bash
npm run dev
```

Manually verify:
1. `http://localhost:3000` — Landing page loads with "세계 만들기" button
2. `http://localhost:3000/create` — Letter editor form loads
3. `http://localhost:3000/gallery` — Empty gallery page loads

- [ ] **Step 3: Final commit with any fixes**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
