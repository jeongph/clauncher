# clauncher 작업 상태판

> **세션 복원용 문서.** 새 세션은 이 파일 → "현재 상태" → "다음 작업" → 설계 문서 순으로 본다.

## 현재 상태 (2026-06-24 기준)

- **1차 완성 — npm 배포 완료** 🎉 `npm i -g clauncher` (또는 `npm i -g github:jeongph/clauncher`) 로 설치·동작.
- **설계**: [docs/specs/2026-06-19-clauncher-design.md](specs/2026-06-19-clauncher-design.md)
- **레포**: https://github.com/jeongph/clauncher (PUBLIC, MIT)
- **구현**: config/launch/prompt/cli — TDD 42개 통과(`node --test`). 로컬 스모크 + Docker 통합 스모크 통과.
- **릴리즈**: v0.1.0 — [GitHub Release](https://github.com/jeongph/clauncher/releases/tag/v0.1.0) + npm registry
- **CI**: `.github/workflows/npm-publish.yml` — release 발행/`workflow_dispatch` 시 자동배포 (현재 `NPM_TOKEN` 토큰 방식)
- **커밋**: config `7d276a2` · launch `23d1b1f` · cli `5d42726`

## 구성 / 동작

- 명령: `clauncher`(저장값 실행) · `clauncher config`(재선택) · 그 외 인자는 claude 패스스루
- 설정파일: `~/.config/clauncher/config.json` (XDG)
- 모듈: `bin/cli.js`(진입점) · `src/cli.js`(오케스트레이션) · `src/config.js` · `src/prompt.js` · `src/launch.js`
- 테스트: `npm test`(= `node --test`), `*.test.js`. Docker 검증: `test/docker-smoke.sh`

## 다음 작업 (예정)

### Trusted Publishing 전환 — 이슈 #5
- npm 배포를 토큰(`NPM_TOKEN`) → OIDC 로 전환해 토큰을 완전히 제거한다. 절차 전부 이슈 #5 에.

### 기능 확장 후보 (설계 9절 YAGNI)
- 다중 명명 프로필 · claude 에서 model/mode 목록 동적 조회 등

## 주의 / 컨벤션

- 상위 `lighthouse/CLAUDE.md` 컨벤션 상속: 커밋(Conventional Commits·한글), 주석(`TAG: yyyy-MM-dd`), git 워크플로우.
- 배포: release 발행 시 GitHub Actions 자동. 수동 트리거 `gh workflow run npm-publish.yml`.
- **PUBLIC 레포** — 토큰·키 등 민감정보 커밋 금지.
