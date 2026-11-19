#!/usr/bin/env bash
# Mint or revoke the child token that gives an AI review one sandbox.
#
#   mint    Writes an MCP config with a child token to $SANDBOX_MCP_CONFIG. The child
#           token has one sandbox, no builds, no network access and no sudo in the
#           sandbox, and only the tools below. It creates no sandbox.
#   revoke  Revokes that child token now instead of waiting for its TTL.
#
# Env: EXPO_SANDBOX_MCP_TOKEN (the parent token), SANDBOX_MCP_CONFIG, and for `mint`: RUN_ID.
# A failure only skips the sandbox. The review runs without one.
set -euo pipefail

MCP_URL=https://agile-minnow-543.convex.site
: "${SANDBOX_MCP_CONFIG:?}"

case "${1:-}" in
  mint)
    : "${EXPO_SANDBOX_MCP_TOKEN:?}" "${RUN_ID:?}"
    body=$(jq -cn --arg name "ecr-review-$RUN_ID" '{
      sandboxBudget: 1, buildBudget: 0, ttlSeconds: 6000, name: $name,
      network: false, sudo: false,
      allowedTools: ["list_sandboxes", "create_sandbox", "sandbox_write_file", "sandbox_exec", "destroy_sandbox"]
    }')
    token=$(curl -sf -m 30 "$MCP_URL/tokens/scoped" \
      -H "Authorization: Bearer $EXPO_SANDBOX_MCP_TOKEN" \
      -H 'Content-Type: application/json' -d "$body" | jq -r '.token // empty') || token=""
    if [ -z "$token" ]; then
      echo "::warning::Could not mint a sandbox token. The review runs without a sandbox."
      exit 0
    fi
    echo "::add-mask::$token"
    umask 077
    jq -n --arg url "$MCP_URL/mcp" --arg auth "Bearer $token" \
      '{mcpServers: {sandbox: {type: "http", url: $url, headers: {Authorization: $auth}}}}' \
      > "$SANDBOX_MCP_CONFIG"
    ;;
  revoke)
    [ -f "$SANDBOX_MCP_CONFIG" ] || exit 0
    : "${EXPO_SANDBOX_MCP_TOKEN:?}"
    child=$(jq -r '.mcpServers.sandbox.headers.Authorization | sub("^Bearer "; "")' "$SANDBOX_MCP_CONFIG")
    jq -cn --arg token "$child" '{token: $token}' |
      curl -sf -m 30 "$MCP_URL/tokens/revoke" \
        -H "Authorization: Bearer $EXPO_SANDBOX_MCP_TOKEN" \
        -H 'Content-Type: application/json' --data-binary @- > /dev/null
    rm -f "$SANDBOX_MCP_CONFIG"
    ;;
  *)
    echo "usage: $0 mint|revoke" >&2
    exit 2
    ;;
esac
