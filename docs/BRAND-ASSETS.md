# 브랜드 자산

최종 갱신: 2026-07-24

## 사양

- 심볼: 북쪽을 가리키는 바늘을 단순화한 나침반
- 주색: `#275d42` (`nav-600`)
- 배경 타일: `#eef5f1` (`nav-50`)
- 형태: Lucide 아이콘 계열과 어울리는 선 기반 미니멀 스타일
- 금지: 그라디언트, 그림자, 장식적 입체 효과
- 워드마크: Pretendard, `AI 수업도구 내비게이션`, `font-weight: 500`

## 제작 방식

형태의 정본은 GPT-Image로 생성한 `assets/brand/compass-gpt-master.png`이다.
생성 이미지의 형태를 유지하면서 색상은 지정된 두 색으로 정규화하고, 작은 화면용 PNG와 멀티사이즈 ICO를 파생했다. SVG 산출물은 사용하지 않는다.

## 산출물

| 파일 | 용도 |
|---|---|
| `assets/brand/compass-gpt-master.png` | GPT-Image 기반 원본 보관용 |
| `assets/brand/compass-mark.png` | 헤더 좌측 워드마크 아이콘, 64px 원본을 CSS 32px로 표시 |
| `assets/brand/favicon-32.png` | 32px 파비콘 |
| `assets/brand/favicon-16.png` | 16px 파비콘 |
| `assets/brand/favicon.ico` | 16px·32px 멀티사이즈 ICO |

## 랜딩 3단계 아이콘

브랜드 심볼을 반복하지 않고 Lucide의 다음 아이콘을 사용한다.

1. `compass` — 분야 선택
2. `map-pin` — 조건 좁히기
3. `route` — 도구 비교

세 아이콘은 `currentColor`와 동일한 스트로크 계열을 사용한다.

## GPT-Image 생성 프롬프트

> Create one minimal app-brand icon: a simplified compass with a needle pointing clearly north. Use only pine green #275d42 and a pale green tile #eef5f1. Match the visual language of Lucide icons: clean monoline strokes, simple geometry, generous negative space, crisp and recognizable at 16px and 32px. Flat vector-like appearance, centered, no text, no letters, no gradient, no shadow, no glow, no texture, no mockup, no extra objects. Square canvas.

