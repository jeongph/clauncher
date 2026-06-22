#!/usr/bin/env bash
# clauncher Docker 통합 스모크 테스트
#
# GitHub 에서 전역 설치한 뒤, 가짜 claude(인자 출력)와 유효 config 를 격리 환경에
# 심어 (1) 플래그 조립·패스스루 전달 과 (2) claude 미설치 시 ENOENT 안내+127 을 검증한다.
# 컨테이너엔 실제 claude 가 없으므로 대화형 메뉴는 유효 config 주입으로 우회한다.
#
# 사용법:  bash test/docker-smoke.sh
# 환경변수: IMAGE(기본 node:lts-slim), SPEC(기본 github:jeongph/clauncher)
set -euo pipefail

IMAGE="${IMAGE:-node:lts-slim}"
SPEC="${SPEC:-github:jeongph/clauncher}"

echo ">>> Docker 스모크: $SPEC @ $IMAGE"

docker run --rm -i -e SPEC_ENV="$SPEC" "$IMAGE" sh <<'INNER'
set -e

# github: 스펙 설치엔 git 이 필요한데 slim 이미지엔 없으므로 준비한다.
if ! command -v git >/dev/null 2>&1; then
  apt-get update >/dev/null 2>&1
  apt-get install -y git >/dev/null 2>&1
fi

echo "[setup] clauncher 설치: $SPEC_ENV"
npm i -g "$SPEC_ENV" >/dev/null 2>&1
echo "[setup] 설치 위치: $(command -v clauncher)"

# 가짜 claude: 받은 인자를 출력해 전달 내용을 확인한다.
printf '#!/bin/sh\necho "FAKE-CLAUDE: $*"\n' > /usr/local/bin/claude
chmod +x /usr/local/bin/claude

# 유효 config 주입 — selection 이 options 에 있으면 메뉴 없이 바로 실행된다.
mkdir -p "$HOME/.config/clauncher"
cat > "$HOME/.config/clauncher/config.json" <<'JSON'
{"version":1,"options":{"mode":[{"label":"Default","flag":"default"}],"model":[{"label":"Opus","flag":"opus"}],"effort":[{"label":"high","flag":"high"}]},"selection":{"mode":"default","model":"opus","effort":"high"}}
JSON

# 검증 1: 저장값이 플래그로 조립되고 패스스루 인자가 그대로 붙는다.
OUT="$(clauncher "hello")"
echo "[test1] $OUT"
echo "$OUT" | grep -q -- '--permission-mode default --model opus --effort high hello' \
  && echo "[PASS] 플래그 조립·패스스루" \
  || { echo "[FAIL] 플래그 전달"; exit 1; }

# 검증 2: claude 미설치(ENOENT) → 안내 메시지 + 종료코드 127.
rm -f /usr/local/bin/claude
set +e
ERR="$(clauncher "x" 2>&1)"; CODE=$?
set -e
echo "[test2] code=$CODE / $ERR"
{ [ "$CODE" = "127" ] && echo "$ERR" | grep -q "찾을 수 없"; } \
  && echo "[PASS] ENOENT 안내 + 127" \
  || { echo "[FAIL] ENOENT 처리"; exit 1; }

echo ">>> ALL PASS"
INNER
