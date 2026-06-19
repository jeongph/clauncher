# clauncher 설계 문서

- 작성일: 2026-06-19
- 상태: 확정 (구현 전)

## 1. 개요

`clauncher` 는 `claude` CLI 를 감싸는 얇은 **런처**다. 저장해 둔 model / permission mode / effort 를 플래그로 얹어 `claude` 를 실행하고, 나머지 인자는 전부 그대로 `claude` 에 패스스루한다.

이름은 `claude` + `launcher` 합성어로, 레포명과 실행 명령어를 동일하게 `clauncher` 로 둔다.

### 해결하려는 문제

`claude` 를 띄울 때마다 `--model`, `--permission-mode`, `--effort` 를 매번 손으로 붙이는 게 번거롭다. 자주 쓰는 조합을 한 번 골라 저장해 두고, 이후엔 명령어 하나로 그 조합을 자동으로 얹어 실행하고 싶다.

## 2. 명령어 구조

```
clauncher                 # 저장값으로 즉시 claude 실행 (최초 실행이면 메뉴부터)
clauncher "프롬프트"        # 위 + 프롬프트 패스스루
clauncher --resume        # 위 + claude 인자 패스스루
clauncher config          # 메뉴를 다시 띄워 재선택 → 저장만 하고 종료(실행 안 함)
```

- 런처가 가로채는 **예약 키워드는 `config` 서브커맨드 하나뿐**이다.
- 그 외 모든 인자는 런처가 해석하지 않고 그대로 `claude` 로 전달한다.

## 3. 사용자 플로우

```
clauncher 실행
   │
   ├─ 설정파일 있고 selection 유효? ──예──▶ 저장값 → 플래그 조립 → claude 실행 (패스스루)
   │
   └─ 아니오 (최초 / 파일 없음 / 손상 / selection 누락)
          │
          ▼
      mode 선택 ▶ model 선택 ▶ effort 선택   (↑↓ + Enter)
          │
          ▼
      selection 저장 ──▶ 바로 claude 실행
```

- **최초 실행**: 3단계 메뉴(mode → model → effort) → 저장 → 그대로 claude 실행까지 한 번에 이어진다.
- **이후 실행**: 메뉴 없이 즉시 실행.
- **`clauncher config`**: 메뉴를 다시 띄우되, 현재 저장값을 기본 커서 위치로 표시한다. 선택 후 저장만 하고 종료한다(실행하지 않음).

## 4. 설정파일

위치: `~/.config/clauncher/config.json` (XDG Base Directory 기준. `$XDG_CONFIG_HOME` 가 있으면 그쪽 우선)

```jsonc
{
  "version": 1,
  "options": {                        // 메뉴에 뜨는 후보 목록 — 사용자가 직접 편집
    "mode": [
      { "label": "Default",            "flag": "default" },
      { "label": "Auto",               "flag": "auto" },
      { "label": "Plan",               "flag": "plan" },
      { "label": "Accept Edits",       "flag": "acceptEdits" },
      { "label": "Bypass Permissions", "flag": "bypassPermissions" },
      { "label": "Don't Ask",          "flag": "dontAsk" }
    ],
    "model": [
      { "label": "(claude 기본)", "flag": null },
      { "label": "Opus",   "flag": "opus" },
      { "label": "Sonnet", "flag": "sonnet" },
      { "label": "Haiku",  "flag": "haiku" },
      { "label": "Fable",  "flag": "fable" }
    ],
    "effort": [
      { "label": "(claude 기본)", "flag": null },
      { "label": "low",    "flag": "low" },
      { "label": "medium", "flag": "medium" },
      { "label": "high",   "flag": "high" },
      { "label": "xhigh",  "flag": "xhigh" },
      { "label": "max",    "flag": "max" }
    ]
  },
  "selection": {                      // 저장된 선택값 — config 서브커맨드가 갱신
    "mode": "default",
    "model": "opus",
    "effort": "high"
  }
}
```

### 설계 의도

- `options` 와 `selection` 의 **수정 주체가 다르다**. `options` 는 사람이 손으로 편집(후보 추가/삭제), `selection` 은 `config` 서브커맨드가 자동 갱신한다. 그래서 한 파일 안에서 개념적으로 분리한다.
- `flag: null` 은 **그 플래그 자체를 안 붙인다**는 뜻이다. `(claude 기본)` 을 고르면 해당 플래그를 생략해 claude 기본값에 맡긴다. (예: Sonnet 처럼 effort 가 적용 안 되는 모델 조합)
- mode 에는 생략 항목을 두지 않는다. `default` 모드가 곧 "생략과 같은 효과"이기 때문이다.
- `version` 은 향후 스키마 변경/마이그레이션(예: 다중 프로필 확장) 여지를 남긴다. 현재는 단일 저장값만 지원한다.

### 플래그 매핑

| selection | claude 플래그 |
|---|---|
| `mode`   | `--permission-mode <flag>` |
| `model`  | `--model <flag>` |
| `effort` | `--effort <flag>` |

`flag` 값이 `null` 인 항목이 선택돼 있으면 해당 플래그를 조립에서 제외한다.

## 5. 플래그 조립 & 실행 메커니즘

1. 설정파일에서 `selection` 을 읽고, 각 `selection` 값에 대응하는 `options` 항목의 `flag` 를 찾는다.
2. `flag` 가 `null` 이 아닌 것만 `--permission-mode/--model/--effort` 로 변환한다.
3. 조립한 플래그 배열 뒤에 **사용자가 넘긴 패스스루 인자**를 그대로 붙인다.
   ```
   ['--permission-mode', mode, '--model', model, '--effort', effort, ...passthrough]
   ```
4. `spawn('claude', args, { stdio: 'inherit' })` 로 실행해 TTY 를 그대로 넘긴다(대화형 세션 정상 동작). 자식 프로세스 종료코드를 그대로 런처 종료코드로 반환한다.

### 플래그 충돌

패스스루 인자에 사용자가 직접 `--model` 등을 또 넣을 수 있다. 런처는 별도 충돌 처리를 하지 않고 그대로 전달한다(claude 의 인자 파서가 통상 뒤쪽 값을 우선). 즉 **사용자가 직접 준 값이 우선**한다.

## 6. 구성 (단일 책임 분리)

| 파일 | 책임 |
|---|---|
| `bin/cli.js`   | 진입점. 인자 파싱, `config` 분기, 전체 오케스트레이션 |
| `src/config.js`| 설정파일 경로 해석, 로드/저장, 기본값 생성, 스키마 검증 |
| `src/prompt.js`| 3단계 select 메뉴 표시(`@inquirer/prompts`) |
| `src/launch.js`| selection → 플래그 배열 조립, claude spawn |

- 런타임: Node.js (ESM), npm 글로벌 설치(`npm i -g` / 개발 중 `npm link`)
- TUI: `@inquirer/prompts` 의 `select` (↑↓ + Enter, 가볍고 크로스플랫폼)

## 7. 에러 처리

- **설정파일 없음/손상(JSON 파싱 실패)/`selection` 누락**: 최초 실행으로 간주해 기본 `options` 로 메뉴를 띄운다. 손상 파일은 기본값으로 재생성한다.
- **`selection` 값이 `options` 에 더 이상 없음**(사용자가 options 를 편집해 항목을 지운 경우): 해당 단계만 메뉴를 다시 띄워 다시 고르게 한다.
- **`claude` 실행파일을 PATH 에서 못 찾음(ENOENT)**: claude 설치/PATH 안내 메시지를 출력하고 비정상 종료코드로 종료한다.
- **설정 디렉토리 생성 실패 등 I/O 오류**: 원인을 명확히 출력하고 종료한다.

## 8. 테스트 전략

순수 로직과 부수효과를 분리해, 순수 함수 위주로 단위 테스트한다.

- `src/launch.js` 의 **플래그 조립 함수**(selection + options + passthrough → args 배열): `null` flag 생략, 패스스루 순서, mode/model/effort 누락 조합 등.
- `src/config.js` 의 **로드/머지/기본생성/검증**: 파일 없음, 손상 JSON, selection 누락, options 에 없는 selection 값 등 분기.
- 메뉴(`prompt.js`)와 `spawn`(부수효과)은 얇게 유지하고, 통합 동작은 수동 검증으로 보완한다.

## 9. 범위 밖 (YAGNI)

- 다중 명명 프로필(현재는 단일 저장값. `version` 으로 확장 여지만 남김)
- claude CLI 에서 model/mode 목록을 동적으로 가져오기(현재는 설정파일의 정적 목록)
- 플래그 충돌 감지/경고(현재는 그대로 패스스루)

## 10. 배포/저장소

- 위치: `repositories/clauncher/` 독립 git 레포
- GitHub: `jeongph/clauncher`
- 초기 커밋: 설계 문서 + README + 프로젝트 스캐폴딩(package.json, .gitignore, LICENSE, bin 스텁). 실제 구현은 별도 작업으로 진행.
