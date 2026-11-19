#!/usr/bin/env bash
# Find whether a PR changes files in the autonomous review scope.
#
# routing.jsonc is the one list of autonomous review paths. Run this from a checkout
# of the base branch, so a PR cannot change the list it is checked against.
#
# Env: GH_TOKEN, REPO, PR. Writes autonomous=true|false to $GITHUB_OUTPUT.
# It does not fail: if it cannot read the scope or the files, it writes false.
set -euo pipefail

ROUTING=.expo-agents/code-review/routing.jsonc

# Only full-line `//` comments are stripped, so keep the file free of trailing ones.
mapfile -t globs < <(sed 's#^[[:space:]]*//.*##' "$ROUTING" |
  jq -r '.scopes[] | select(.name == "autonomous") | .paths[]')

in_scope() {
  local glob
  for glob in "${globs[@]}"; do
    # Unquoted on purpose: the right side is a glob pattern.
    # shellcheck disable=SC2053
    if [[ $1 == $glob ]]; then
      return 0
    fi
  done
  return 1
}

if [ "${1:-}" = --self-test ]; then
  in_scope packages/patch-project/src/index.ts
  in_scope packages/expo/src/index.ts && exit 1
  in_scope packages/patch-project && exit 1
  echo "ai-review-scope self-test ok"
  exit 0
fi

if [ "${#globs[@]}" -eq 0 ]; then
  echo "::warning::Could not read the autonomous scope paths from $ROUTING."
fi
files=$(gh api --paginate "repos/$REPO/pulls/$PR/files" --jq '.[].filename' || true)
autonomous=false
while IFS= read -r file; do
  if [ -n "$file" ] && in_scope "$file"; then
    autonomous=true
    break
  fi
done <<< "$files"
echo "autonomous=$autonomous" >> "$GITHUB_OUTPUT"
