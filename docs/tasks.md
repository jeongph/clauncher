# clauncher 작업 상태판

> **세션 복원용 문서.** 새 세션은 이 파일 → "현재 상태" → "이어서 시작하는 법" → 설계 문서 정독 → "예정" 순서대로 진행한다.

## 현재 상태 (2026-06-21 기준)

- **설계 확정**: [docs/specs/2026-06-19-clauncher-design.md](specs/2026-06-19-clauncher-design.md)
- **레포**: https://github.com/jeongph/clauncher (PUBLIC, MIT), 브랜치 `main`, 초기 커밋 `b1a07d9`
- **스캐폴딩 완료**: `package.json` / `.gitignore` / `LICENSE` / `README.md` / `bin/cli.js`(미구현 스텁) / 빈 `src/`
- **구현 코드**: 아직 없음. `bin/cli.js` 는 "미구현" 출력 후 종료하는 플레이스홀더.

## 이어서 시작하는 법 (새 세션)

```sh
cd repositories/clauncher
npm install            # @inquirer/prompts 설치
```
1. 설계 문서 정독: `docs/specs/2026-06-19-clauncher-design.md` (스키마/플로우/에러처리/테스트 전략 전부 여기 있음)
2. 아래 "예정" 태스크를 **TDD** 로 1→2→3→4→5 순서대로 구현
3. `npm test`(= `node --test`) 로 순수 로직 검증, 마지막에 `npm link` 로 수동 통합 검증

## 진행 방식

- **TDD**: 순수 로직(플래그 조립, 설정 로드/머지)부터 테스트 먼저 작성.
- **구현 순서**: `src/config.js` → `src/launch.js` → `src/prompt.js` → `bin/cli.js` 통합.
- **테스트 러너**: `node --test` (의존성 추가 없이 내장 사용). 테스트는 `*.test.js`.

## 진행중

(없음 — 구현 착수 전)

## 예정 (구현 태스크)

### 1. 설정 모듈 `src/config.js`
**Why**: 모든 동작의 기반. 저장값(selection)과 후보목록(options)을 읽고, 없으면 기본 생성해야 메뉴/실행이 성립한다.
- 경로 해석: `$XDG_CONFIG_HOME/clauncher/config.json`, 없으면 `~/.config/clauncher/config.json`
- 기본 config 생성: 설계 문서 4절 스키마 그대로 (mode 6개 / model 5개·첫 항목 `flag:null` / effort 6개·첫 항목 `flag:null`, selection 기본값)
- `load()`: 파일 없음 / JSON 파싱 실패 / selection 누락 → "최초 실행" 신호 반환. 손상 파일은 기본값으로 재생성.
- `save(selection)`: selection 만 갱신하고 사용자가 편집한 options 는 보존.
- 검증: selection 값이 options 에 존재하는지 확인. 없으면 그 단계만 재선택 신호.
- **테스트**: 파일 없음 / 손상 JSON / selection 누락 / options 에 없는 selection 값 분기 전부.

### 2. 플래그 조립 + 실행 `src/launch.js`
**Why**: 런처의 핵심. selection + 패스스루 인자를 claude 인자 배열로 정확히 변환해야 한다.
- `buildArgs(selection, options, passthrough)` — **순수 함수**:
  - 각 selection 값 → 해당 options 항목의 `flag` 조회
  - `flag === null` 이면 그 플래그 생략, 아니면 `--permission-mode` / `--model` / `--effort` 로 변환
  - 결과 순서: `[...조립한 플래그, ...passthrough]`
- `run(args)`: `spawn('claude', args, { stdio: 'inherit' })`, 자식 종료코드 그대로 반환. `ENOENT`(claude 미설치) 시 설치/ PATH 안내 후 비정상 종료.
- **테스트**: `buildArgs` — null flag 생략 / passthrough 순서 / mode·model·effort 누락 조합.

### 3. 메뉴 `src/prompt.js`
**Why**: 최초 실행·재설정 시 사용자가 방향키로 고르는 UX.
- `@inquirer/prompts` 의 `select` 로 mode → model → effort 3단계.
- 각 단계 choices = `options[step]` (label 표시). 재설정 시 현재 저장값을 default(커서 위치)로.
- 로직은 config/launch 에 두고 이 파일은 얇게 유지.

### 4. 진입점 `bin/cli.js`
**Why**: 전체 오케스트레이션 + `config` 서브커맨드 분기.
- `argv[2] === 'config'` → 메뉴 띄워 selection 저장 후 종료(실행 안 함).
- 그 외 → `load()`. selection 유효하면 바로 `buildArgs` + `run`(나머지 argv 패스스루).
- 최초/누락/손상 → 메뉴 → 저장 → 바로 `run`.
- 기존 스텁(`console.error` + exit 1) 대체.

### 5. 마무리
**Why**: 배포 가능 상태로 만든다.
- README 사용법/설치 최종화.
- `npm link` 로 수동 통합 검증: 최초 메뉴→실행 / 재실행 즉시 실행 / `clauncher config` 재선택 / 패스스루(`clauncher "프롬프트"`, `clauncher --resume`).
- 커밋(컨벤션 준수) & 푸시.

## 주의 / 컨벤션

- 상위 `lighthouse/CLAUDE.md` 컨벤션 자동 상속: 커밋(Conventional Commits·한글), 주석(`TAG: yyyy-MM-dd`), git 워크플로우.
- git 워크플로우는 Git Flow 기준이나 현재 `develop`/feature 브랜치 없음 → 본격 구현 전 사용자와 브랜치 전략 확인(초기 단계라 main 직접 작업 여부).
- 작업 완료 직전 Notion "Claude history" 기록(초기 셋업은 이미 기록됨).
- **PUBLIC 레포** — 토큰·키 등 민감정보 커밋 금지.
