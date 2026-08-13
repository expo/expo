#!/usr/bin/env bash
# Select one configured credential, probe it, export the winner.
# Empty inputs are skipped. Logs indexes only — never the value.
set -euo pipefail

classify_failure() {
  local lc
  lc=$(tr '[:upper:]' '[:lower:]' < "$1")
  if printf '%s' "$lc" | grep -Eq \
    '429|rate[[:space:]_-]*limit|too many requests|overloaded_error|usage[[:space:]_.-]*(limit|quota|exceed)|quota[[:space:]_.-]*(exceed|exhaust)|credit[[:space:]_.-]*(exceed|exhaust)|out of (usage|credits|quota)|hit your (usage |rate )?limit'; then
    echo usage
  elif printf '%s' "$lc" | grep -Eq \
    '401|403|unauthorized|unauthorised|invalid[[:space:]_-]*(api[[:space:]_-]*)?token|token[[:space:]_-]*(expired|revoked|invalid)|oauth token has expired|authentication (failed|error)|not authenticated|invalid x-api-key|please run /login'; then
    echo auth
  else
    echo other
  fi
}

token_shape() {
  case "$1" in
    sk-ant-oat*) echo oat ;;
    sk-ant-api*) echo api ;;
    *) echo other ;;
  esac
}

probe_order() {
  case "$(token_shape "$1")" in
    oat) echo "CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_AUTH_TOKEN ANTHROPIC_API_KEY" ;;
    api) echo "ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN" ;;
    *) echo "CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_AUTH_TOKEN ANTHROPIC_API_KEY" ;;
  esac
}

# GitHub's secret editor is write-only; a paste that includes the assignment
# or wrapping quotes is a common 401. Strip one layer. Never log the value.
normalize_token() {
  local v="$1"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  case "$v" in
    \"*\"|\'*\') v="${v:1:${#v}-2}" ;;
  esac
  v="${v#CLAUDE_CODE_OAUTH_TOKEN=}"
  v="${v#ANTHROPIC_API_KEY=}"
  v="${v#ANTHROPIC_AUTH_TOKEN=}"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  printf '%s' "$v"
}

if [ "${1:-}" = --self-test ]; then
  tmp=$(mktemp)
  printf '%s\n' 'HTTP 429 rate_limit_error: rate limit exceeded' >"$tmp"
  [ "$(classify_failure "$tmp")" = usage ]
  printf '%s\n' "You've hit your usage limit. Try again later." >"$tmp"
  [ "$(classify_failure "$tmp")" = usage ]
  printf '%s\n' 'OAuth token has expired. Please run /login.' >"$tmp"
  [ "$(classify_failure "$tmp")" = auth ]
  printf '%s\n' '401 invalid x-api-key' >"$tmp"
  [ "$(classify_failure "$tmp")" = auth ]
  printf '%s\n' 'ECONNRESET connection reset by peer' >"$tmp"
  [ "$(classify_failure "$tmp")" = other ]
  rm -f "$tmp"
  [ "$(token_shape "sk-ant-oat01-aaaa")" = oat ]
  [ "$(token_shape "sk-ant-api03-aaaa")" = api ]
  [ "$(token_shape "not-a-token")" = other ]
  [ "$(probe_order "sk-ant-oat01-aaaa")" = "CLAUDE_CODE_OAUTH_TOKEN ANTHROPIC_AUTH_TOKEN ANTHROPIC_API_KEY" ]
  [ "$(probe_order "sk-ant-api03-aaaa")" = "ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN" ]
  [ "$(normalize_token "  sk-ant-oat01-x  ")" = "sk-ant-oat01-x" ]
  [ "$(normalize_token "'sk-ant-oat01-x'")" = "sk-ant-oat01-x" ]
  [ "$(normalize_token 'CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-x')" = "sk-ant-oat01-x" ]
  echo "prepare-model-env self-test ok"
  exit 0
fi

mask_token() {
  local t="$1"
  t="${t//$'\n'/}"
  t="${t//$'\r'/}"
  [ -n "$t" ] || return 0
  printf '::add-mask::%s\n' "$t"
}

trim() {
  local v="$1"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  printf '%s' "$v"
}

if ! command -v claude >/dev/null 2>&1; then
  echo "::error::claude CLI is not on PATH; install it before this action."
  exit 1
fi

model="${PICK_MODEL-}"
model="${model#anthropic/}"
model="$(trim "$model")"
if [ -z "$model" ]; then
  echo "::error::model input is required."
  exit 1
fi

run_id="${PICK_RUN_ID:-0}"
if ! [[ "$run_id" =~ ^[0-9]+$ ]]; then
  run_id=0
fi

SLOT_INDEXES=()
SLOT_TOKENS=()

for i in $(seq 1 5); do
  var="C$i"
  val="$(normalize_token "${!var:-}")"
  if [ -n "$val" ]; then
    mask_token "$val"
    SLOT_INDEXES+=("$i")
    SLOT_TOKENS+=("$val")
  fi
done

val="$(normalize_token "${C_FALLBACK:-}")"
if [ -n "$val" ]; then
  already=false
  for existing in "${SLOT_TOKENS[@]+"${SLOT_TOKENS[@]}"}"; do
    if [ "$existing" = "$val" ]; then
      already=true
      break
    fi
  done
  if [ "$already" = false ]; then
    mask_token "$val"
    SLOT_INDEXES+=("0")
    SLOT_TOKENS+=("$val")
  fi
fi

if [ ${#SLOT_INDEXES[@]} -eq 0 ]; then
  echo "::error::No model credential configured."
  exit 1
fi

count=${#SLOT_INDEXES[@]}
start=$((run_id % count))

winner=""
winner_slot=""
winner_env=""
log_dir="${RUNNER_TEMP:-/tmp}"
log=""
# Fresh config so a runner-image login cannot mask a bad secret, and so CI
# matches a laptop canary that set CLAUDE_CONFIG_DIR.
probe_cfg=$(mktemp -d)
trap 'rm -rf "$probe_cfg"' EXIT

probe_with_env() {
  local env_name="$1"
  local token="$2"
  local out="$3"
  unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN CLAUDE_CODE_OAUTH_TOKEN
  export CLAUDE_CONFIG_DIR="$probe_cfg"
  export "$env_name=$token"
  set +e
  if command -v timeout >/dev/null 2>&1; then
    timeout 90 claude -p "Reply with the single word ok. Say nothing else." \
      --model "$model" \
      --disallowedTools Bash \
      >"$out" 2>&1
  else
    claude -p "Reply with the single word ok. Say nothing else." \
      --model "$model" \
      --disallowedTools Bash \
      >"$out" 2>&1
  fi
  local rc=$?
  set -e
  return "$rc"
}

for offset in $(seq 0 $((count - 1))); do
  idx=$(((start + offset) % count))
  slot="${SLOT_INDEXES[$idx]}"
  token="${SLOT_TOKENS[$idx]}"
  log="$log_dir/model-env-$slot.log"
  echo "credential $slot: shape=$(token_shape "$token") len=${#token}"

  for env_name in $(probe_order "$token"); do
    if probe_with_env "$env_name" "$token" "$log"; then
      winner="$token"
      winner_slot="$slot"
      winner_env="$env_name"
      break 2
    fi
  done

  # Classify on EVERY slot, not only the ones that have a successor: the last
  # slot's verdict is the one a caller reports.
  reason=$(classify_failure "$log")

  if [ "$offset" -lt $((count - 1)) ]; then
    next_idx=$(((start + offset + 1) % count))
    next_slot="${SLOT_INDEXES[$next_idx]}"
    echo "credential $slot failed ($reason), trying $next_slot"
  fi
done

if [ -z "$winner" ]; then
  # A FILE, not a step output. This step is failing, so a caller must not have
  # to rely on outputs propagating out of a failed composite action. The file's
  # ABSENCE is itself the useful signal: it means no probe ever ran, so the
  # failure is not about the credentials at all — a missing local action, a bad
  # input, a runner fault. Callers that blame the secrets unconditionally send
  # maintainers off to rotate five working tokens.
  printf '%s\n' "${reason:-other}" >"$log_dir/model-env-reason" || true
  echo "::error::Model credential unavailable (${reason:-other})."
  if [ -n "$log" ] && [ -f "$log" ]; then
    sed -n '1,40p' "$log" || true
  fi
  exit 1
fi

if [ -z "${GITHUB_ENV:-}" ]; then
  echo "::error::GITHUB_ENV is unset."
  exit 1
fi

{
  echo "$winner_env=$winner"
  echo "CLAUDE_CODE_REVIEW_EXPO_OSS_API_TOKEN=$winner"
} >>"$GITHUB_ENV"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "slot=$winner_slot" >>"$GITHUB_OUTPUT"
fi
