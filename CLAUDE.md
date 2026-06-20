# clauncher

`claude` CLI 를 감싸는 얇은 런처. 저장한 model / permission-mode / effort 를 플래그로 얹어 `claude` 를 실행하고, 나머지 인자는 그대로 패스스루한다.

## 새 세션은 여기부터

1. **작업 상태판**: [docs/tasks.md](docs/tasks.md) — 현재 상태, 다음 할 일, 이어서 시작하는 법
2. **설계 문서**: [docs/specs/2026-06-19-clauncher-design.md](docs/specs/2026-06-19-clauncher-design.md) — 확정 설계(스키마/플로우/에러처리/테스트 전략)

## 핵심 사실

- 런타임: Node.js(ESM) / TUI: `@inquirer/prompts` / 테스트: `node --test`
- 명령어: `clauncher`(저장값으로 실행) / `clauncher config`(재선택) / 그 외 인자는 claude 로 패스스루
- 설정파일: `~/.config/clauncher/config.json` (XDG)
- 구성: `bin/cli.js`(진입점) · `src/config.js`(설정) · `src/prompt.js`(메뉴) · `src/launch.js`(플래그 조립·실행)

## 작업 규칙

- 상위 `lighthouse/CLAUDE.md` 컨벤션 상속(커밋·주석·git 워크플로우). 커밋/주석/PR 등 커뮤니케이션은 한글.
- 구현은 TDD: 순수 로직(`config`/`launch`)부터 테스트와 함께.
- PUBLIC 레포 — 민감정보 커밋 금지.
