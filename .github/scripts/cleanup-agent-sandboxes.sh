#!/usr/bin/env bash
# Destroy every sandbox created under one scoped expo-sandbox-mcp token.
set -euo pipefail

extract_session_ids() {
  jq -r '.result.content[]? | select(.type == "text") | .text' |
    while IFS= read -r line; do
      case "$line" in
        *" — "*) printf '%s\n' "${line%% *}" ;;
      esac
    done
}

if [ "${1:-}" = --self-test ]; then
  actual=$(printf '%s\n' '{"result":{"content":[{"type":"text","text":"abc123456789 — active; project demo\ndef987654321 — paused; project other"}]}}' | extract_session_ids)
  expected=$'abc123456789\ndef987654321'
  [ "$actual" = "$expected" ]
  [ -z "$(printf '%s\n' '{"result":{"content":[{"type":"text","text":"No sandbox sessions. Use create_sandbox to start one."}]}}' | extract_session_ids)" ]
  echo "cleanup-agent-sandboxes self-test ok"
  exit 0
fi

config=${1:-}
if [ -z "$config" ] || [ ! -f "$config" ]; then
  echo "No scoped MCP config exists; no sandbox cleanup is needed."
  exit 0
fi

url=$(jq -er '.mcpServers.sandbox.url' "$config")
authorization=$(jq -er '.mcpServers.sandbox.headers.Authorization' "$config")
response=$(mktemp)
sessions=$(mktemp)
trap 'rm -f "$response" "$sessions"' EXIT

mcp_call() {
  local id=$1
  local name=$2
  local arguments=$3
  jq -cn --argjson id "$id" --arg name "$name" --argjson arguments "$arguments" \
    '{jsonrpc:"2.0", id:$id, method:"tools/call", params:{name:$name, arguments:$arguments}}' |
    curl -sS --fail-with-body --max-time 45 --connect-timeout 10 \
      --retry 2 --retry-connrefused "$url" \
      -H "Authorization: $authorization" \
      -H 'Content-Type: application/json' \
      --data-binary @-
}

if ! mcp_call 1 list_sandboxes '{}' >"$response"; then
  # --fail-with-body keeps the server's body on an HTTP error, so a 401 from an
  # expired token, a 429, and a 502 are distinguishable. Plain `curl -f`
  # discarded it and made all three print this one indistinguishable line.
  echo "::error::Could not list scoped sandbox sessions for cleanup."
  sed -n '1,10p' "$response" || true
  exit 1
fi
if ! jq -e '.error == null and .result.isError != true' "$response" >/dev/null; then
  echo "::error::The MCP server refused the scoped sandbox list call."
  jq -r '.error.message // .result.content[]?.text // empty' "$response"
  exit 1
fi
extract_session_ids <"$response" >"$sessions"

if [ ! -s "$sessions" ]; then
  echo "No leftover scoped sandbox sessions."
  exit 0
fi

failed=0
call_id=1
while IFS= read -r session_id; do
  call_id=$((call_id + 1))
  args=$(jq -cn --arg sessionId "$session_id" '{sessionId:$sessionId}')
  if mcp_call "$call_id" destroy_sandbox "$args" >"$response" &&
    jq -e '.error == null and .result.isError != true' "$response" >/dev/null; then
    echo "Destroyed leftover sandbox session $session_id."
  else
    echo "::error::Could not destroy leftover sandbox session $session_id."
    jq -r '.error.message // .result.content[]?.text // empty' "$response" || true
    failed=1
  fi
done <"$sessions"

exit "$failed"
