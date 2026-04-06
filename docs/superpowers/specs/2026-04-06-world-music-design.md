# World Music — 편지의 세계

> 노래에서 느끼는 세계를 편지로 쓰면, AI가 그 감정을 3D 세계로 만들어주는 웹 앱.

**프로젝트 동기:** 노래를 듣는 동안 우리는 잠시 그 세계의 주민이 된다. 하지만 노래가 끝나면 그 세계는 희미해진다. 이 프로젝트는 그 세계를 붙잡아두고, 노래가 끝난 뒤에도 머물 수 있게 하며, 다른 사람들과 공유할 수 있게 한다. 같은 노래라도 사람마다 느끼는 세계는 다르고, 그 다름을 존중한다. 가수에게 보내는 헌정이기도 하다.

**이중 목표:**
1. **제품**: 편지 → 3D 세계 생성 웹 앱 (Phase 1)
2. **학습**: 오픈소스 world model 탐험 및 점진적 접목 (Phase 2)

---

## 1. 사용자 플로우 ✅ (승인됨)

```
1. 🎵 노래 등록
   - YouTube URL 입력
   - 노래 제목, 아티스트 이름 입력

2. ✉️ 편지 쓰기
   - 텍스트 에디터에서 이 노래가 안겨주는 세계를 자유롭게 묘사
   - 예: "비 온 뒤의 따뜻한 쓸쓸함, 창밖으로 보이는 흐린 하늘..."

3. 🌍 세계 생성
   - "세계 만들기" 버튼 클릭
   - AI가 편지를 해석 → 세계 파라미터 + 스카이박스 생성
   - 로딩 중 편지의 핵심 키워드가 떠오르는 연출

4. 🎧 세계 체험
   - 노래가 자동 재생되며 가이드 여정 시작
   - 카메라가 세계의 주요 장면들을 안내
   - 노래가 끝나면 → "이 세계에 머물겠습니까?" → 자유 탐험 모드

5. 💾 저장 & 공유
   - 세계가 개인 갤러리에 저장됨
   - 갤러리 URL을 공유하면 다른 사람이 방문 가능
```

---

## 2. 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Letter   │  │ Gallery  │  │ World Viewer      │  │
│  │ Editor   │  │ Page     │  │ (Three.js Canvas) │  │
│  │          │  │          │  │                   │  │
│  │ - 편지작성│  │ - 세계목록│  │ - 3D 렌더링      │  │
│  │ - YT URL │  │ - 미리보기│  │ - 카메라 제어     │  │
│  │          │  │ - 공유   │  │ - YouTube 재생    │  │
│  └──────────┘  └──────────┘  │ - 파티클/대기효과 │  │
│                              └───────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │ API Routes
┌──────────────────▼──────────────────────────────────┐
│                   Backend (Next.js API)              │
│                                                     │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ /api/world   │  │ /api/gallery│  │ /api/auth  │  │
│  │ generate     │  │             │  │ (optional) │  │
│  └──────┬───────┘  └─────────────┘  └────────────┘  │
│         │                                           │
│  ┌──────▼───────────────────────────────────────┐   │
│  │           AI Pipeline                         │   │
│  │                                               │   │
│  │  편지 → Claude API → World Config (JSON)      │   │
│  │                    → Skybox Prompt             │   │
│  │                    → Camera Timeline           │   │
│  │                                               │   │
│  │  Skybox Prompt → Image Gen API → Skybox Image │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌───────────────────────────────────────────────┐   │
│  │           Database (SQLite / Prisma)           │   │
│  │  - World: config, skybox URL, letter, song    │   │
│  │  - User: profile, gallery settings            │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 프론트엔드 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 랜딩 | 프로젝트 소개, "세계 만들기" CTA |
| `/create` | 세계 생성 | 편지 에디터 + YouTube URL 입력 + 생성 버튼 |
| `/world/:id` | 세계 체험 | Three.js 뷰어 + YouTube 재생 + 가이드/자유 모드 |
| `/gallery` | 내 갤러리 | 내가 만든 세계 목록, 각 세계의 썸네일 + 제목 |
| `/gallery/:userId` | 공유 갤러리 | 다른 사람이 방문하는 공개 갤러리 |

---

## 3. AI 파이프라인

편지를 세계로 변환하는 핵심 파이프라인.

### 3.1 편지 해석 (Claude API)

편지를 입력받아 구조화된 World Config를 생성한다.

**입력:** 사용자가 쓴 편지 텍스트 + 노래 제목/아티스트 (참고 정보)

**출력:** World Config JSON

```json
{
  "world": {
    "terrain": {
      "type": "ocean" | "plains" | "mountains" | "forest" | "desert" | "urban" | "abstract" | "void",
      "variation": "string (자유 텍스트 — AI가 terrain type에 맞는 구체적 변형을 기술)",
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
        "subtype": "string",
        "position_hint": "center" | "scattered" | "horizon" | "overhead",
        "scale": 0.0-1.0
      }
    ],
    "mood": {
      "primary_emotion": "string",
      "intensity": 0.0-1.0,
      "description": "AI가 해석한 세계의 한 줄 요약"
    }
  },
  "skybox_prompt": "이미지 생성 AI에게 보낼 스카이박스 프롬프트 (영어)",
  "camera_timeline": [
    {
      "timestamp_pct": 0.0,
      "position": { "x": 0, "y": 5, "z": 20 },
      "look_at": { "x": 0, "y": 2, "z": 0 },
      "transition": "smooth",
      "description": "인트로 — 먼 곳에서 세계를 조망"
    },
    {
      "timestamp_pct": 0.25,
      "position": { "x": -5, "y": 3, "z": 10 },
      "look_at": { "x": 0, "y": 1, "z": 0 },
      "transition": "smooth",
      "description": "1절 — 세계 안으로 천천히 진입"
    },
    {
      "timestamp_pct": 0.5,
      "position": { "x": 0, "y": 2, "z": 0 },
      "look_at": { "x": 5, "y": 3, "z": -10 },
      "transition": "smooth",
      "description": "후렴 — 세계의 중심에서 주위를 둘러봄"
    },
    {
      "timestamp_pct": 1.0,
      "position": { "x": 0, "y": 4, "z": -5 },
      "look_at": { "x": 0, "y": 2, "z": 10 },
      "transition": "smooth",
      "description": "아웃트로 — 세계를 다시 조망하며 마무리"
    }
  ]
}
```

**`camera_timeline`의 `timestamp_pct`**: 노래 전체 길이에 대한 비율 (0.0 = 시작, 1.0 = 끝). YouTube API에서 현재 재생 위치를 가져와 비율로 환산한 뒤, 타임라인의 카메라 위치/방향 사이를 보간(interpolation)한다.

### 3.2 스카이박스 생성 (이미지 생성 API)

Claude가 생성한 `skybox_prompt`를 이미지 생성 API에 전달하여 360도 파노라마 스카이박스를 생성한다.

**기본 API: Blockade Labs Skybox AI** — 전용 360 스카이박스 생성 API. 프롬프트 → equirectangular 이미지 한 장.
**대안:** DALL-E 3 / Stable Diffusion — 일반 이미지 생성 후 equirectangular 변환 필요. Blockade Labs가 불가할 경우에만.

**출력:** equirectangular 파노라마 이미지 (JPEG/PNG) → Three.js의 `EquirectangularReflectionMapping`으로 하늘에 매핑.

### 3.3 카메라 타임라인

Claude가 편지의 감정 흐름을 해석하여 카메라 경로를 설계한다.

- 노래의 구조(인트로/절/후렴/브릿지/아웃트로)에 맞춰 장면을 배치
- 감정이 고조되면 카메라가 가까이, 잔잔하면 멀리
- 각 포인트 사이는 부드러운 보간(Catmull-Rom spline 등)으로 연결
- 노래 길이를 모르므로 비율(`timestamp_pct`)로 설계 → 재생 시 실제 시간에 매핑

---

## 4. Three.js 세계 렌더링

### 4.1 렌더링 레이어

```
Layer 3 (최상위): UI 오버레이
  - 가사 표시 (선택적)
  - "자유 탐험" 모드 전환 버튼
  - 미니맵 (선택적)

Layer 2: 파티클 & 대기 효과
  - 비, 눈, 반딧불, 꽃잎, 먼지 등
  - 안개 (Fog / FogExp2)
  - 포스트 프로세싱 (bloom, color grading)

Layer 1: 오브젝트
  - 나무, 바위, 물, 구조물 등
  - World Config의 objects 배열에 따라 배치
  - 미리 제작한 에셋의 조합 (GLTF 모델)

Layer 0 (바닥): 지형 + 스카이박스
  - Procedural terrain (noise 기반 높이맵)
  - AI 생성 equirectangular 스카이박스
  - 물 표면 (반사 셰이더)
```

### 4.2 카메라 모드

**가이드 모드 (노래 재생 중):**
- `camera_timeline`에 따라 카메라가 자동으로 이동
- YouTube 현재 재생 시간 → `timestamp_pct` 변환 → 카메라 위치 보간
- 사용자 입력 제한 (마우스로 시점 약간 회전만 가능)

**자유 탐험 모드 (노래 종료 후):**
- First-person 또는 orbit 카메라 컨트롤
- WASD / 마우스 드래그로 이동
- 세계 전체를 자유롭게 탐험

### 4.3 음악 연동 (YouTube IFrame API)

```
YouTube Player
  ├─ onStateChange → 재생/일시정지/종료 감지
  ├─ getCurrentTime() → 현재 재생 위치
  │   └─ → timestamp_pct = currentTime / duration
  │       └─ → 카메라 타임라인 보간
  └─ onEnd → 자유 탐험 모드 전환 트리거
```

**제약 사항:**
- YouTube IFrame API는 모바일 브라우저에서 자동재생이 제한될 수 있음 → "재생" 버튼으로 사용자 인터랙션 필요
- 일부 영상은 임베드가 차단될 수 있음 → 에러 처리 + "직접 YouTube에서 재생하세요" 안내

---

## 5. 데이터 모델

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  password  String?
  worlds    World[]
  createdAt DateTime @default(now())
}

model World {
  id          String   @id @default(cuid())
  title       String
  artist      String
  youtubeUrl  String
  letter      String
  worldConfig Json
  skyboxUrl   String?
  thumbnailUrl String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**저장 전략:**
- `worldConfig`: World Config JSON 전체를 JSON 컬럼에 저장
- `skyboxUrl`: 생성된 스카이박스 이미지를 파일 스토리지(Cloudflare R2 또는 Vercel Blob)에 업로드 후 URL 저장
- `thumbnailUrl`: 세계의 미리보기 이미지 — Three.js 캔버스를 캡처하여 저장

---

## 6. 기술 스택

| 카테고리 | 기술 | 이유 |
|----------|------|------|
| **프레임워크** | Next.js (App Router) | UIGen과 동일 스택, SSR + API 라우트 |
| **3D 렌더링** | Three.js + React Three Fiber | 브라우저 3D의 사실상 표준, React와 통합 |
| **AI (편지 해석)** | Claude API (Anthropic SDK) | 감정/분위기 해석에 강점, structured output |
| **AI (스카이박스)** | Blockade Labs API | 전용 360 스카이박스 생성, 품질 좋음 |
| **음악 재생** | YouTube IFrame API | 무료, 대부분의 노래 커버, 재생 상태 감지 |
| **DB** | SQLite + Prisma | 가볍고 빠른 개발, 로컬 개발 용이 |
| **파일 스토리지** | Cloudflare R2 (또는 Vercel Blob) | 스카이박스 이미지 저장, 무료 티어 넉넉 |
| **배포** | Vercel | Next.js 최적화, 무료 티어로 시작 |
| **인증** | NextAuth.js (선택적) | 갤러리 소유자 식별, 초기엔 없이 시작 가능 |

---

## 7. Phase 2: World Model 탐험 (별도 트랙)

Phase 1과 독립적으로 진행하는 학습/연구 트랙.

### 7.1 탐험 로드맵

```
Step 1: Word2World 실험 (Mac에서 가능)
  - LLM이 텍스트로부터 게임 세계를 생성하는 구조 이해
  - 편지를 넣으면 어떤 세계가 나오는지 실험
  - 학습: LLM → structured world description 파이프라인

Step 2: Oasis 실험 (GCP GPU 활용)
  - 실시간 인터랙티브 world model 체험
  - diffusion 기반 세계 생성의 가능성과 한계 파악
  - 학습: real-time interactive world generation

Step 3: 접목 가능성 탐색
  - Phase 1의 procedural 세계 생성을 world model로 대체/보강할 수 있는지 평가
  - 예: world model이 스카이박스 대신 전체 장면을 생성
  - 예: world model이 세계의 동적 요소(날씨 변화, 시간 흐름)를 담당
```

### 7.2 GCP 크레딧 활용 계획

- **Word2World**: CPU로 충분, Mac에서 실행 → GCP 불필요
- **Oasis**: GPU 필요 (A100 또는 T4) → GCP에서 VM 생성하여 실험
- 예상 크레딧 소비: A100 1시간 약 4,000원 → 30만원이면 약 75시간 사용 가능

---

## 8. MVP 스코프

Phase 1의 첫 번째 릴리스에 포함할 최소 기능.

**포함:**
- 편지 에디터 (텍스트 입력)
- YouTube URL 입력
- Claude API로 World Config 생성
- Three.js 세계 렌더링 (지형 + 파티클 + 조명)
- 스카이박스 생성 및 적용
- YouTube 재생 + 가이드 카메라
- 자유 탐험 모드
- 세계 저장 및 목록 조회 (갤러리)
- 갤러리 공유 URL

**제외 (나중에):**
- 사용자 인증 (초기엔 로컬/세션 기반)
- 세계 편집/커스터마이즈
- 소셜 기능 (좋아요, 댓글)
- 모바일 최적화
- Phase 2 world model 통합

---

## 9. 프로젝트 이름 후보

현재 워킹 타이틀: **World Music**

의미: 음악(Music)이 만들어내는 세계(World). "World Music"이라는 기존 음악 장르 용어와 겹치지만, 완전히 다른 맥락에서의 재해석.

최종 이름은 Jay가 결정. 대안 후보:
- **Worldify** — 노래를 세계로 만든다
- **SongScape** — 노래의 풍경
- **편지의 세계** — 한국어 이름도 가능
- 현재 이름 유지도 OK
