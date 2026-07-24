# 배포·운영 절차

이 프로젝트는 빌드 없이 루트 디렉터리의 정적 파일을 그대로 배포한다. 배포 대상에는 `index.html`, `assets/`, `data/`가 모두 포함되어야 한다.

> 현재 상태: 사용자가 Cloudflare Pages 연결과 정본 도메인을 보류했다. 이 문서는 향후 요청 시 사용할 절차이며, 별도 승인 없이 배포하지 않는다.

## Cloudflare Pages 배포 전 점검

1. `node scripts/validate-data.mjs`를 실행해 데이터 구조와 출처 참조를 확인한다.
2. `node scripts/audit-data.mjs`를 실행해 재검증 기한이 지난 정보가 있는지 확인한다.
3. `node scripts/serve.mjs`로 로컬에서 검색·필터·비교·상세 화면을 확인한다.
4. Cloudflare Pages에서 정적 파일을 업로드할 때 빌드 명령은 비워 두고, 출력 디렉터리는 프로젝트 루트로 설정한다.
5. Pretendard(jsDelivr), Lucide(unpkg), Google S2 favicon 접근이 학교망에서 가능한지 확인한다. 운영 안정성이 필요하면 배포 전에 로컬 자산으로 이전한다.
6. 배포에 필요한 것은 `index.html`, `assets/`, `data/`뿐이다. 다음은 런타임에 불필요하므로 업로드에서 제외한다: `docs/`, `scripts/`, `node_modules/`, `assets/brand/compass-gpt-master.png`(원본 마스터), `assets/**/README.md`.
7. `_redirects`에 `edu-nav.pages.dev` → `nav.dgedu.link` 301 리다이렉트가 있다. 커스텀 도메인이 Pages 프로젝트에 연결되기 전까지는 이 리다이렉트가 방문자를 아직 연결되지 않은 도메인으로 보내 접속 실패를 일으킨다 — 도메인 연결 전에는 비활성화하거나, 도메인 연결과 함께 배포한다.

## 정기 운영 기준

| 대상 | 주기 | 확인 내용 |
|---|---:|---|
| 연령·요금·약관 | 90일 | 학생 직접 사용 연령, 무료 범위, 계정·동의 조건 |
| 기능·언어·S2B | 180일 | 기능 제공 여부, 한국어 범위, 공개목록·상품 정보 |
| 조사 대기열 | 월 1회 | 공식 제품 주소와 학생 계정·개인정보·가격 근거 확보 여부 |

## 갱신 원칙

- 새 후보는 먼저 `data/research-queue.json`에 기록한다.
- 공식 제품 주소, 안전 조건, 최소 한 건의 공식 출처가 확인된 뒤에만 `tools.json`에 공개한다.
- 심층 조건은 `tool-enrichment.json`에 기록하고, 모든 `source_ids`를 `sources.json`에 추가한다.
- S2B 공개목록에서 확인하지 못한 경우에는 `미입점`이라고 쓰지 않는다.
- 배포 직전 실제 모바일 기기·스크린리더·느린 네트워크 상태를 확인한다.
- 정본 도메인이 정해지기 전에는 canonical URL을 임의로 추가하지 않는다.
