# AI 학습도구 큐레이션

초·중·고 교사를 위한 **AI 기반 학습도구** 모음. 분야·대상학령·교과·요금·**연령제한**으로 필터·검색하는 정적 홈페이지.

- 제작: 대구광역시교육청 교사 · 1인 운영 · 무료 티어 중심
- 스택: 순수 정적(HTML/CSS/JS, 무빌드) → Cloudflare Pages 배포 예정
- 현재: 프로토타입 (도구 80개, 12개 분야, 심층 보강 16개, 공식 출처 47건)
- 화면: 소개형 랜딩에서 분야 또는 검색으로 목록에 진입하며, 앱별 로고·카드 전체 열기·상세 공유 링크(`?tool=도구ID`)·최대 4개 비교를 지원
- 인수인계: Claude 작업자는 먼저 [`CLAUDE.md`](CLAUDE.md)와 [`docs/CODEX-HANDOFF.md`](docs/CODEX-HANDOFF.md)를 확인

## 실행 (로컬 프리뷰)
```bash
node scripts/serve.mjs   # http://localhost:5173
```
> `data/*.json`을 fetch하므로 `index.html`을 `file://`로 직접 열면 안 됩니다. 반드시 로컬 서버 사용.

## 구조
```
ai-digital-site/
├─ CLAUDE.md               # Claude 작업 시작 안내
├─ index.html              # 카탈로그 페이지
├─ assets/
│  ├─ styles.css           # 테마(라이트/다크)·반응형·안전도 색상
│  └─ app.js               # data/*.json fetch → 필터·검색 렌더 (무빌드)
├─ data/
│  ├─ tools.json           # 도구 데이터 (표준 프로필)
│  ├─ tool-enrichment.json # 심층 조사 보강값(도입·언어·안전·판정)
│  ├─ sources.json         # 공식 출처 레지스트리
│  ├─ research-queue.json  # 공개 목록과 분리한 심층 조사 대기 후보
│  ├─ baseline-tool-ids.json # 기존 70개 도구 ID 보존 기준
│  └─ taxonomy.json        # 카테고리·교과·요금·연령 등 열거값 (필터 UI의 원천)
├─ scripts/
│  ├─ serve.mjs            # 로컬 프리뷰 서버 (개발용)
│  ├─ validate-data.mjs    # JSON 필수값·열거값·출처 참조 검사
│  └─ audit-data.mjs       # 검증일 기준 재검증 대상 점검
├─ .claude/launch.json     # 프리뷰 설정
└─ docs/
   ├─ CODEX-HANDOFF.md     # 현재 구현·결정·검증·다음 작업 통합 인수인계
   ├─ PLAN.md              # 기획: 택소노미 + 로드맵 + 확정 결정
   ├─ SCHEMA.md            # 데이터 스키마 (표준 프로필 필드 정의)
   ├─ RESEARCH-NOTES.md    # 리서치 출처·검증상태·백로그
   ├─ CHANGELOG.md         # 개발 과정 기록
   └─ STATUS.md            # 진행 현황 + 남은 작업(우선순위)
```

## 데이터 추가 방법
1. [`docs/SCHEMA.md`](docs/SCHEMA.md)의 필드 규칙에 맞춰 `data/tools.json`에 객체 추가
2. 카테고리·교과·요금·연령 값은 [`data/taxonomy.json`](data/taxonomy.json)의 열거값만 사용 (새 값 필요 시 taxonomy 먼저 갱신)
3. 필터 UI는 taxonomy에서 자동 생성되므로 별도 코드 수정 불필요
4. `node scripts/serve.mjs`로 확인

### 심층 조사 데이터

- 기존 목록을 일괄 수정하지 않고 `data/tool-enrichment.json`의 같은 `id`를 화면에서 결합한다.
- 보강 데이터의 `source_ids`는 `data/sources.json`에 반드시 존재해야 한다.
- `data/research-queue.json`은 근거가 충분하지 않은 후보를 공개 도구와 분리해 관리한다.
- 게시 전에는 `node scripts/validate-data.mjs`를 실행한다.
- 운영 점검에는 `node scripts/audit-data.mjs`를 실행한다.

## 배포
빌드 과정 없음. 폴더 전체를 Cloudflare Pages에 업로드 (출력 디렉터리 = 루트, 빌드 명령 없음). 자세한 점검·운영 기준은 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)를 따른다.

> 사용자가 Cloudflare Pages 연결과 정본 도메인을 보류했다. 별도 요청 전에는 배포하지 않는다.

## 화면 외부 의존성

- Pretendard: jsDelivr
- Lucide: unpkg
- 앱 로고: Google S2 favicon, `logo_url` 지정 시 개별 이미지 우선

앱 로고를 불러오지 못하면 분야별 Lucide 아이콘이 표시된다. 학교망·오프라인 안정성이 필요하면 외부 자산을 로컬로 이전한다.

## 주의
연령제한·요금 등 안전 정보는 서비스 정책 변동이 잦습니다. **도입 전 각 서비스 공식 페이지에서 재확인**하세요. 검증 상태는 각 도구의 `verified_at`·`notes`와 [`docs/STATUS.md`](docs/STATUS.md) 참고.
