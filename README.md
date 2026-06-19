# clauncher

`claude` CLI 를 감싸는 얇은 **런처**. 저장해 둔 model / permission mode / effort 를 플래그로 얹어 `claude` 를 실행하고, 나머지 인자는 그대로 `claude` 에 전달(패스스루)한다.

> 이름은 `claude` + `launcher` 합성어다.

## 왜?

`claude` 를 띄울 때마다 `--model`, `--permission-mode`, `--effort` 를 매번 붙이는 게 번거롭다. 자주 쓰는 조합을 한 번 골라 저장해 두고, 이후엔 명령어 하나로 자동으로 얹어 실행한다.

## 사용법

```sh
clauncher                 # 저장값으로 즉시 claude 실행 (최초 실행이면 메뉴부터)
clauncher "프롬프트"        # 위 + 프롬프트 패스스루
clauncher --resume        # 위 + claude 인자 패스스루
clauncher config          # 메뉴를 다시 띄워 재선택 → 저장만 하고 종료
```

- 최초 실행 시 `mode → model → effort` 를 방향키(↑↓) + Enter 로 고른다.
- 한 번 고르면 이후엔 메뉴 없이 바로 실행된다.
- 다시 고르려면 `clauncher config`.

## 설정파일

`~/.config/clauncher/config.json` (XDG 기준). 메뉴에 뜨는 후보 목록(`options`)은 직접 편집해 추가/삭제할 수 있다. 자세한 스키마는 [설계 문서](docs/specs/2026-06-19-clauncher-design.md)를 참고.

## 설치

```sh
npm install -g clauncher
```

> 구현 진행 중. 자세한 설계는 [docs/specs/2026-06-19-clauncher-design.md](docs/specs/2026-06-19-clauncher-design.md) 참고.

## 요구사항

- Node.js >= 18
- PATH 에 `claude` CLI 가 설치돼 있어야 한다
