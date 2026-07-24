# Claude 작업 안내

이 폴더는 **AI 수업도구 큐레이션 정적 사이트의 현재 작업 정본**이다.

작업을 시작하기 전에 반드시 [`docs/CODEX-HANDOFF.md`](docs/CODEX-HANDOFF.md)를 읽는다. 현재 구현, 데이터 현황, 사용자 결정, 검증 명령, 알려진 제약과 다음 작업이 모두 정리되어 있다.

## 핵심 원칙

- 순수 HTML/CSS/JavaScript 무빌드 구조를 유지한다.
- 공개 데이터는 `data/tools.json`, 심층 정보는 `data/tool-enrichment.json`, 공식 근거는 `data/sources.json`에서 관리한다.
- 새 도구는 공식 주소·연령·계정·요금·출처를 검증한 뒤 공개한다. 근거가 부족하면 `data/research-queue.json`에 먼저 넣는다.
- 데이터 변경 후 반드시 아래 명령을 실행한다.

```powershell
node scripts/validate-data.mjs
node scripts/audit-data.mjs
```

- 로컬 확인은 `node scripts/serve.mjs` 실행 후 `http://localhost:5173/`에서 한다. `file://`로 열지 않는다.
- Cloudflare Pages 연결과 정본 도메인은 사용자가 보류했다. 별도 요청 없이 배포하거나 도메인을 연결하지 않는다.
- AI 추천 도우미는 기획만 완료된 상태다. API 키를 클라이언트에 넣지 않으며, AI 호출은 추후 서버 측 계층으로 분리한다.
- 이 폴더에는 Git 저장소와 `.openai/hosting.json`이 없다. 이전 ChatGPT Sites 프로젝트를 현재 사이트의 배포 대상으로 오인하지 않는다.

