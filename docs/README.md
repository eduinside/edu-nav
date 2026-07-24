# 문서 안내 (docs 인덱스)

AI 수업도구 내비게이션(nav.dgedu.link) 개발 문서 모음. 목적별로 나뉜다.

## 어디부터 볼까
- **처음 인수인계 받았다면** → [CODEX-HANDOFF.md](CODEX-HANDOFF.md) (구조·결정·QA·다음 작업 총괄)
- **지금 상태·남은 일** → [STATUS.md](STATUS.md)
- **데이터 추가할 때** → [SCHEMA.md](SCHEMA.md) + 루트 [../README.md](../README.md)

## 문서 목록
| 문서 | 역할 |
|---|---|
| [CODEX-HANDOFF.md](CODEX-HANDOFF.md) | **인수인계 총괄** — 현재 상태, 화면 흐름, 파일 지도, 결정·금지사항, 다음 작업 |
| [STATUS.md](STATUS.md) | 진행 현황 + 우선순위별 남은 작업(P1~P6) + 열린 결정 |
| [PLAN.md](PLAN.md) | 초기 기획 — 분류 체계(택소노미) + 로드맵 + 확정 방향 |
| [SCHEMA.md](SCHEMA.md) | 데이터 스키마 — 표준 프로필 필드 정의 + 규칙 |
| [RESEARCH-NOTES.md](RESEARCH-NOTES.md) | 리서치 로그 — 출처, 안전정보 검증, 제외 사유, 백로그 |
| [CHANGELOG.md](CHANGELOG.md) | 개발 과정 기록(시간순) |
| [EDZIP-INTEGRATION-PLAN.md](EDZIP-INTEGRATION-PLAN.md) | EDZIP 조사 통합 + AI 추천 도우미(P5) 계획 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 배포·운영 절차(Cloudflare Pages, 재검증 주기) |
| [BRAND-ASSETS.md](BRAND-ASSETS.md) | 브랜드 자산 — 나침반 로고·파비콘 사양·제작 방식 |

## 데이터·자산 위치
- `data/` — `tools.json`(공개), `tool-enrichment.json`(심층 16), `sources.json`(출처), `research-queue.json`(공개 전 후보), `taxonomy.json`(열거값), `baseline-tool-ids.json`
- `assets/brand/` — 사이트 나침반 로고·파비콘 (원본 마스터 `compass-gpt-master.png` 포함, 배포 제외 대상)
- `assets/logos/` — 도구별 앱 로고 ([규칙](../assets/logos/README.md))
- `scripts/` — `serve.mjs`(로컬), `validate-data.mjs`, `audit-data.mjs`
