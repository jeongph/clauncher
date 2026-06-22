# clauncher 작업 상태판

> **세션 복원용 문서.** 새 세션은 이 파일 → "현재 상태" → "이어서 시작하는 법" → 설계 문서 정독 → "예정" 순서대로 진행한다.

## 현재 상태 (2026-06-22 기준)

- **설계 확정**: [docs/specs/2026-06-19-clauncher-design.md](specs/2026-06-19-clauncher-design.md)
- **레포**: https://github.com/jeongph/clauncher (PUBLIC, MIT), 브랜치 `main`, 초기 커밋 `b1a07d9`
- **동작형 구현 완료**: config/launch/prompt/cli 전부 — TDD 42개 통과(`node --test`). 로컬 스모크(가짜 claude)로 플래그 조립·패스스루 검증. `bin/cli.js` 진입점 완성.
- **커밋**: config `7d276a2` · launch `23d1b1f` · prompt+cli `5d42726`
- **버전**: 0.1.0 (릴리즈 준비)

## 이어서 시작하는 법 (새 세션)

```sh
cd repositories/clauncher
npm install            # @inquirer/prompts 설치
```
1. 설계 문서 정독: `docs/specs/2026-06-19-clauncher-design.md` (스키마/플로우/에러처리/테스트 전략 전부 여기 있음)
2. 아래 "예정" 태스크를 **TDD** 로 번호 순서대로 구현
3. `npm test`(= `node --test`) 로 순수 로직 검증, 마지막에 `npm link` 로 수동 통합 검증

## 진행 방식

- **TDD**: 순수 로직(플래그 조립, 설정 로드/머지)부터 테스트 먼저 작성.
- **구현 순서**: `src/config.js` → `src/launch.js` → `src/prompt.js` → `bin/cli.js` 통합.
- **테스트 러너**: `node --test` (의존성 추가 없이 내장 사용). 테스트는 `*.test.js`.

## 진행중

### 릴리즈 & 검증 (실행 계획 B~E)
- **B 통합**: worktree 브랜치 push → `gh pr create` → PR 즉시 머지(main).
- **C 릴리즈**: version 0.1.0, `gh release create v0.1.0` → `npm i -g github:jeongph/clauncher` 가능.
- **D Docker 스모크**: `test/docker-smoke.sh` (main push 후 실행) — 플래그 전달 + ENOENT(127) 검증.
- **E npm publish**: 사용자 `npm login`(OTP) 후 `npm publish`. 패키지명 `clauncher` 미선점.

## 예정

(없음 — 위 "릴리즈 & 검증" 완료 시 1차 완성. 이후 후보: 설계 9절 YAGNI 항목 — 다중 명명 프로필, 동적 model/mode 목록 등)

## 주의 / 컨벤션

- 상위 `lighthouse/CLAUDE.md` 컨벤션 자동 상속: 커밋(Conventional Commits·한글), 주석(`TAG: yyyy-MM-dd`), git 워크플로우.
- git 워크플로우는 Git Flow 기준이나 현재 `develop`/feature 브랜치 없음 → 본격 구현 전 사용자와 브랜치 전략 확인(초기 단계라 main 직접 작업 여부).
- 작업 완료 직전 Notion "Claude history" 기록(초기 셋업은 이미 기록됨).
- **PUBLIC 레포** — 토큰·키 등 민감정보 커밋 금지.
