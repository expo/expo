#!/usr/bin/env bash
# Publish .github/expo-bot.md to the expo-bot profile README (expo-bot/expo-bot)
# when the copy there is missing or differs. No-op when already current.
set -euo pipefail

SRC="${SRC:-.github/expo-bot.md}"
DEST_REPO="${DEST_REPO:-expo-bot/expo-bot}"
DEST_PATH="${DEST_PATH:-README.md}"

b64encode() {
  openssl base64 -A
}

b64decode() {
  openssl base64 -d -A
}

if [ "${1:-}" = --self-test ]; then
  sample=$'hello\nworld\n'
  [ "$(printf '%s' "$sample" | b64encode | b64decode)" = "$sample" ]
  echo "sync-expo-bot-manpage self-test ok"
  exit 0
fi

if [ ! -f "$SRC" ]; then
  echo "::error::Manpage source missing: $SRC"
  exit 1
fi

login=$(gh api user --jq .login)
if [ "$login" != "expo-bot" ]; then
  echo "::error::Manpage sync must run as expo-bot (authenticated as $login)."
  exit 1
fi

desired_b64=$(b64encode < "$SRC")

if ! gh api "repos/$DEST_REPO" >/dev/null 2>&1; then
  echo "Creating $DEST_REPO"
  gh repo create "$DEST_REPO" --public \
    --description "Maintainer commands for expo/expo" \
    --homepage "https://github.com/expo/expo"
fi

sha=""
current_tmp=$(mktemp)
trap 'rm -f "$current_tmp"' EXIT
if meta=$(gh api "repos/$DEST_REPO/contents/$DEST_PATH" --jq '{sha:.sha,content:.content}' 2>/dev/null); then
  sha=$(printf '%s' "$meta" | jq -r .sha)
  printf '%s' "$meta" | jq -r .content | tr -d '\n' | b64decode >"$current_tmp" || true
fi

if [ -n "$sha" ] && cmp -s "$SRC" "$current_tmp"; then
  echo "Manpage already current on $DEST_REPO"
  exit 0
fi

args=(
  -X PUT "repos/$DEST_REPO/contents/$DEST_PATH"
  -f message="Sync manpage from expo/expo"
  -f content="$desired_b64"
)
if [ -n "$sha" ]; then
  args+=(-f sha="$sha")
fi

gh api "${args[@]}" --jq .content.html_url
echo "Updated $DEST_REPO/$DEST_PATH"
