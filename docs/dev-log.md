# World Music 개발 일지

## 2026-04-06 — 프로젝트 탄생

프로젝트의 시작은 하나의 질문이었다: **노래가 끝나면 희미해지는 그 세계에, 계속 머물 수 있다면?**

노래를 들으면 하나의 세계가 보인다. 하지만 그건 내 안에서만 존재하고, 노래가 끝나면 사라진다. 이걸 붙잡아두고, 다른 사람에게도 보여줄 수 있게 만들고 싶었다. 특히 그 아름다운 세계를 안겨준 가수에게 "내가 느낀 당신의 세계"를 헌정하고 싶었다.

### 핵심 결정들

브레인스토밍을 거쳐 내린 결정들:

- **입력**: 노래(YouTube URL) + 편지(내가 느끼는 세계를 자유롭게 묘사)
- **출력**: 브라우저에서 탐험할 수 있는 3D 세계
- **AI의 역할**: 편지의 추상적 감정을 구체적인 시각 요소로 번역
- **경험 흐름**: 노래 재생 중엔 가이드 여정 → 끝나면 자유 탐험 (여운을 이어감)
- **비주얼**: 편지 톤에 따라 AI가 스타일을 결정 (추상/자연/혼합)

---

## 2026-04-07 — MVP 구현

### 기술 스택 선정

| 역할 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 | SSR + API 라우트를 하나의 프로젝트에서 |
| 3D | Three.js + React Three Fiber | 브라우저 3D의 사실상 표준 |
| AI | Claude API | 감정/분위기 해석에 강점 |
| 스카이박스 | Blockade Labs | 360도 파노라마 전문 |
| 음악 | YouTube IFrame API | 무료, 거의 모든 노래 |
| DB | Prisma + SQLite | 가볍고 빠른 개발 |

### 겪은 문제들

#### 문제 1: Prisma 7 — schema 호환성 깨짐

**증상**: `npx prisma migrate dev`가 실패하면서 이런 에러:
```
The datasource property `url` is no longer supported in schema files.
```

**원인**: Prisma 7이 출시되면서 `schema.prisma`에서 `url = env("DATABASE_URL")` 문법이 제거됨. 대신 `prisma.config.ts` 파일을 별도로 만들어야 한다.

**해결**: Prisma 7 대신 **Prisma 6**을 사용.
```bash
npm install prisma@^6 @prisma/client@^6
```
프로젝트 초기에는 안정 버전이 낫다고 판단. Prisma 7 마이그레이션은 프로젝트가 안정된 후에 해도 늦지 않다.

**교훈**: 최신 major 버전이 항상 좋은 건 아니다. 특히 ORM 같은 핵심 의존성은 호환성 확인 후 올리자.

---

#### 문제 2: React Three Fiber v9 — bufferAttribute API 변경

**증상**: 빌드 시 `<bufferAttribute>` 컴포넌트에서 타입 에러.

**원인**: R3F v9에서 `<bufferAttribute>`의 props 전달 방식이 바뀜. 기존:
```tsx
<bufferAttribute count={N} array={arr} itemSize={3} />
```
v9에서는:
```tsx
<bufferAttribute args={[arr, 3]} />
```

**해결**: Particles.tsx에서 `args` 형태로 변경.

**교훈**: Three.js 생태계는 React 래퍼(R3F)의 버전 변화가 빠르다. 공식 마이그레이션 가이드를 꼭 확인하자.

---

#### 문제 3: Mock 모드 — API 키 검증 로직 허점

**증상**: API 키 없이도 앱을 체험할 수 있게 mock 모드를 만들었는데, `.env.local`에 `ANTHROPIC_API_KEY="your-key-here"`가 들어있어서 mock을 건너뛰고 실제 API를 호출 → 401 에러.

**원인**: mock 조건이 `!apiKey || apiKey === "your-anthropic-api-key"`였는데, 실제 `.env.local`에는 `"your-key-here"`라는 다른 placeholder가 들어있었음.

**해결**: placeholder 문자열 비교 대신 **실제 키 포맷 검증**으로 변경:
```typescript
if (!apiKey || !apiKey.startsWith("sk-ant-")) {
  // mock 모드
}
```

**교훈**: "유효하지 않은 값"을 리스트로 관리하지 말고, "유효한 값의 형태"를 체크하는 게 훨씬 견고하다.

---

#### 문제 4: Node.js 25 — localStorage가 SSR을 깨뜨림

**증상**: `npm run dev`로 서버를 띄우면 모든 페이지에서 `TypeError: localStorage.getItem is not a function`이 발생하며 500 에러.

**원인**: Node.js 25에서 **실험적으로 `localStorage`를 `globalThis`에 추가**했다. 하지만 `--localstorage-file` 플래그 없이 실행하면 `localStorage` 객체는 존재하되 `getItem` 같은 메서드가 동작하지 않는다. Next.js (또는 그 내부 의존성)가 SSR 중에 `localStorage`가 존재하는지 확인 → 존재함 → `getItem()` 호출 → 크래시.

**디버깅 과정**:
1. 우리 코드에서 `localStorage` 검색 → 없음
2. `node_modules`에서 검색 → Next.js 내부에서만 사용
3. `node -e "console.log(typeof globalThis.localStorage)"` → `object` (있어야 할 리가 없는데!)
4. `node -e "console.log(typeof globalThis.localStorage?.getItem)"` → `undefined` (존재하지만 메서드가 없음!)
5. Node.js 25의 실험적 localStorage 기능이 원인임을 확인

**해결**: `next.config.ts`에서 서버 시작 시점에 깨진 `localStorage`를 제거:
```typescript
if (
  typeof globalThis.localStorage !== "undefined" &&
  typeof globalThis.localStorage.getItem !== "function"
) {
  delete (globalThis as Record<string, unknown>).localStorage;
}
```

**교훈**: "우리 코드에 없는 에러"가 나면, (1) 의존성 패키지 문제이거나 (2) 런타임 환경 문제다. Node.js 같은 런타임의 최신 버전도 breaking change의 원인이 될 수 있다. 에러 메시지에 나오는 키워드(`localStorage`)를 우리 코드에서 먼저 검색하고, 없으면 런타임 환경을 의심하자.

---

## 2026-04-07 — 아키텍처 전환: 기본 도형 → AI 이미지 기반 세계

### 근본적 문제 인식

"붉은장미"에 대한 편지를 넣었을 때, Ollama가 "고대의 이끼 낀 숲, 붉은 빛이 스며드는 연못"이라고 아무리 멋진 묘사를 해도, 화면에 나오는 건 **빨간 원뿔 + 반투명 원 + 컬러 배경**이었다. 아무리 LLM이 똑똑해도, 렌더러가 기본 도형밖에 못 그리면 소용없다.

### 해결: 이미지 AI를 세계의 주 비주얼로

```
이전: 편지 → LLM → 파라미터(색, 형태) → Three.js 기본 도형 → "텅 빈 세계"
이후: 편지 → LLM → 장면 묘사 → 이미지 AI → 360° 파노라마 + 깊이맵 → Three.js 깊이 렌더러 → "몰입형 세계"
```

**핵심 컴포넌트: DepthPanorama**
- 대형 구체(sphere) 메시의 안쪽에 AI가 생성한 360도 파노라마를 매핑
- 깊이맵(depth map)으로 정점을 변위(displacement) → 가까운 물체는 안쪽으로, 먼 물체는 바깥으로
- 카메라가 움직이면 자연스러운 **parallax(시차)** 효과 발생
- 커스텀 GLSL 셰이더로 구현 (vertex displacement + fog blending)

**이미지 생성: Replicate API**
- Flux Schnell: 텍스트 → equirectangular 파노라마 이미지 (2:1 비율)
- Depth Anything V2: 이미지 → 깊이맵 (grayscale)
- API 키 없으면 기존 프로시저럴 렌더링으로 graceful fallback

**교훈**: 진짜 문제를 정확히 찾는 게 중요하다. "LLM이 편지를 잘 이해 못 해서"가 아니라 "렌더러가 결과를 표현할 수 없어서"가 진짜 원인이었다.

---

## 현재 상태

- **아키텍처**: AI 이미지 기반 세계 + 프로시저럴 fallback
- **AI 파이프라인**: Claude/Ollama (편지 해석) → Replicate Flux (파노라마) → Depth Anything (깊이맵)
- **렌더링**: DepthPanorama (셰이더) + 파티클 + 대기 효과 + 카메라 가이드
- **테스트**: 11개 전부 통과
- **다음**: Replicate API 토큰을 넣으면 진짜 AI가 그린 세계를 볼 수 있음
