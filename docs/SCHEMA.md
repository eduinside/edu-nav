# 데이터 스키마 — 표준 프로필

`data/tools.json`은 도구 객체의 배열. 각 도구는 아래 필드를 가진다.
열거값(카테고리·교과·태그)은 `data/taxonomy.json`에 정의된 값만 사용.

```jsonc
{
  "id": "magicschool",            // 고유 slug (영문 소문자·하이픈)
  "name": "MagicSchool AI",       // 표기명
  "name_ko": "매직스쿨",           // 한글 표기(있으면)
  "category": "코스웨어·LMS",      // 주 카테고리 (taxonomy.categories 중 1)
  "subcategory": "교사 업무자동화", // 보조 카테고리(선택)
  "one_liner": "교사용 AI 수업준비 도구 모음 (수업안·평가문항 자동생성)",
  "grades": ["초등고", "중", "고"], // taxonomy.grades 중 다수
  "subjects": ["범교과"],          // taxonomy.subjects 중 다수
  "user": "교사",                  // "학생" | "교사" | "둘다"
  "pricing": "부분무료",           // taxonomy.pricing 중 1
  "korean_support": true,          // 한국어 지원 여부
  "domestic": false,               // 국내(에듀테크몰/에듀집 등) 도입 여부
  "age_limit": "18+",              // "없음" | "13+" | "14+" | "18+" | "교사전용"
  "login_required": true,
  "form": "웹",                    // taxonomy.forms 중 1
  "classroom_use": "수업지도안·형성평가 문항을 몇 초 만에 초안 생성",
  "url": "https://www.magicschool.ai/",
  "logo_url": "assets/logos/magicschool.svg", // 선택: 공식·로컬 로고. 없으면 도메인 파비콘 사용
  "tags": ["평가", "수업준비"],     // 자유 태그(필터 보조)
  "source": ["에듀테크몰"],         // 근거: 등재처/확인출처
  "verified_at": "2026-07-24",    // 정보 확인일

  // 심층 조사 보강 필드 (data/tool-enrichment.json에서 id 기준 결합 가능)
  "provider": "Magic School",     // 운영사
  "aliases": ["MagicSchool"],     // 이전명·교육용 상품명 등 검색 별칭
  "secondary_categories": ["평가·퀴즈·피드백"],
  "edition": "일반·교육용 플랜의 적용 조건을 구분해 기록",
  "lesson_stages": ["수업 준비", "평가"],
  "ai_modes": ["수업안 생성", "형성평가 생성"],
  "languages": {
    "interface": "한국어 포함 여부와 범위",
    "generation_response": "생성·응답 언어",
    "translation": "번역 기능과 범위",
    "voice": "음성 입출력 언어와 제한",
    "korean_official": true,
    "korean_quality": "공식 지원·현장 검증 필요"
  },
  "adoption": {
    "student_account": "학생 계정·참여 흐름",
    "pricing_detail": "무료 범위와 학교·기관 플랜",
    "platforms": ["웹"],
    "integrations": ["LMS"],
    "difficulty": "입문"
  },
  "safety": { "summary": "핵심 안전 정보", "cautions": ["교사 검토 필요"] },
  "review": {
    "readiness": "추천",          // "추천" | "조건부 활용" | "참고"
    "reason": "판정 사유",
    "evidence_level": "E3",       // E0~E3
    "status": "1차 조사 완료"
  },
  "procurement": { "s2b_public_listing": "홈 공개목록에서 미확인", "products": [] },
  "source_ids": ["S013", "L011"]
}
```

## 필드 규칙
- `id`, `name`, `category`, `one_liner`, `grades`, `pricing`, `url`, `verified_at` — **필수**
- 나머지는 정보 확인 시 채우고, 미확인 값은 `null` 또는 생략(빈 값 표시)
- `age_limit`은 학생 직접 사용 판단의 핵심 → 가능한 한 채운다
- `logo_url`은 선택 필드다. 공식 로고의 사용 권한과 출처를 확인한 뒤 로컬 자산 경로를 권장한다. 값이 없으면 화면은 도구 URL 기반 파비콘을 시도하고 실패 시 분야 Lucide 아이콘을 사용한다.
- 열거값 벗어난 값이 필요하면 `taxonomy.json`을 먼저 갱신
- 심층 조사 필드는 현재 `data/tools.json`을 보존하기 위해 `data/tool-enrichment.json`에 둘 수 있으며, 같은 `id`를 가진 객체를 화면에서 결합한다.
- `source_ids`의 모든 값은 `data/sources.json`에 존재해야 한다. 출처에는 발행처·제목·URL·확인일을 기록한다.
- `readiness`는 추천 순위가 아니라 공개 가능한 학교 적용 조건의 명확성을 뜻한다. 연령·학생 계정·개인정보가 불명확하면 `추천`으로 지정하지 않는다.
- `procurement.s2b_public_listing`의 `홈 공개목록에서 미확인`은 `미입점`을 뜻하지 않는다.

## 조사 대기열

`data/research-queue.json`은 공식 주소·연령·계정·개인정보·요금 등의 근거가 부족해 공개 도구 목록에 넣지 않은 후보를 관리한다.

- `id`, `name`, `priority`, `confirmed`, `unknown`, `evidence_level`, `source_ids`, `status`를 기록한다.
- `source_ids`는 `sources.json`에 있는 출처만 참조한다.
- 대기열 항목은 학생 사용 조건과 공식 제품 주소가 검증된 뒤에만 `tools.json`으로 승격한다.
