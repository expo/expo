#!/usr/bin/env bash
# Find whether a PR changes files in the autonomous review scope.
#
# routing.jsonc is the one list of autonomous review paths. Run this from a checkout
# of the default branch, so a PR cannot change the list it is checked against.
# ecr reads routing.jsonc from the PR's base commit, so a PR into another branch can
# get a different answer from ecr. ecr still gates the sandbox on its own.
#
# Env: GH_TOKEN, REPO, PR. Writes autonomous=true|false to $GITHUB_OUTPUT.
# It does not fail: if it cannot read the scope or the files, it writes false.
set -euo pipefail

ROUTING=.expo-agents/code-review/routing.jsonc

# Only full-line `//` comments are stripped, so keep the file free of trailing ones.
mapfile -t globs < <(sed 's#^[[:space:]]*//.*##' "$ROUTING" |
  jq -r '.scopes[] | select(.name == "autonomous") | .paths[]')

# Bash globs do not match like ecr's, so accept only `<dir>/**` and match its prefix.
for glob in "${globs[@]}"; do
  prefix=${glob%/\*\*}
  if [ "$prefix" = "$glob" ] || [[ $prefix == *[\*?[]* ]]; then
    echo "::warning::Unsupported autonomous scope path '$glob' in $ROUTING. Use '<dir>/**'."
    globs=()
    break
  fi
done

in_scope() {
  local glob
  for glob in "${globs[@]}"; do
    if [[ $1 == "${glob%\*\*}"* ]]; then
      return 0
    fi
  done
  return 1
}

if [ "${1:-}" = --self-test ]; then
  in_scope packages/patch-project/src/index.ts
  in_scope packages/expo/src/index.ts && exit 1
  in_scope packages/patch-project-extra/index.ts && exit 1
  in_scope packages/patch-project && exit 1
  echo "ai-review-scope self-test ok"
  exit 0
fi

if [ "${#globs[@]}" -eq 0 ]; then
  echo "::warning::Could not read the autonomous scope paths from $ROUTING."
fi
# A name with a line break would read as two files, so it fails the whole list.
# A failed page clears the list instead of keeping the pages before it.
files=$(gh api --paginate "repos/$REPO/pulls/$PR/files" \
  --jq '.[].filename | if test("[\\n\\r]") then error("line break in a file name") else . end') ||
  files=""
autonomous=false
while IFS= read -r file; do
  if [ -n "$file" ] && in_scope "$file"; then
    autonomous=true
    break
  fi
done <<< "$files"
echo "autonomous=$autonomous" >> "$GITHUB_OUTPUT"
