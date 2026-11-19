#!/usr/bin/env bash
# Find whether a PR changes files in the autonomous review scope.
#
# routing.jsonc is the one list of autonomous review paths. Run this from a checkout
# of the default branch, so a PR cannot change the list it is checked against.
# ecr reads routing.jsonc from the PR's base commit, so a PR into another branch can
# get a different answer from ecr. ecr still gates the sandbox on its own.
#
# Env: GH_TOKEN, REPO, PR. Writes to $GITHUB_OUTPUT:
#   autonomous=true|false       some changed file is in the scope
#   only_autonomous=true|false  every changed file is in the scope, apart from changesets
#                               that name only packages in the scope
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
# Each line is `<kind><TAB><path>[<TAB><packages>]`. A rename also lists its old path,
# as kind `old`. A changeset lists the package names its front matter bumps.
# A name with a line break would read as two files, so it fails the whole list.
# A failed page clears the list instead of keeping the pages before it.
files=$(gh api --paginate "repos/$REPO/pulls/$PR/files" --jq '.[] |
  if ([.filename, .previous_filename // ""] | any(test("[\\n\\r\\t]")))
  then error("control character in a file name") else . end |
  if (.filename | test("^\\.changeset/[^/]+\\.md$")) and .status == "added"
  then "changeset\t\(.filename)\t\([(.patch // "") | scan("(?m)^\\+[\"'\'']?([@A-Za-z0-9._/-]+)[\"'\'']?: *(?:patch|minor|major) *$")[0]] | join(","))"
  else "file\t\(.filename)", (.previous_filename // empty | "old\t\(.)") end') ||
  files=""
# The files API stops at 3000 files, so a longer PR cannot be all in the scope.
changed=$(gh api "repos/$REPO/pulls/$PR" --jq .changed_files) || changed=""
listed=$(grep -c $'^\\(file\\|changeset\\)\t' <<< "$files" || true)
autonomous=false
only_autonomous=false
if [ -n "$files" ] && [ "${#globs[@]}" -gt 0 ] && [ "$changed" = "$listed" ]; then
  only_autonomous=true
fi
while IFS=$'\t' read -r kind file packages; do
  [ -n "$file" ] || continue
  if [ "$kind" = changeset ]; then
    # npm names map to directories here: `patch-project` is packages/patch-project.
    [ -n "$packages" ] || only_autonomous=false
    for package in ${packages//,/ }; do
      in_scope "packages/$package/" || only_autonomous=false
    done
  elif in_scope "$file"; then
    [ "$kind" = old ] || autonomous=true
  else
    only_autonomous=false
  fi
done <<< "$files"
[ "$autonomous" = true ] || only_autonomous=false
echo "autonomous=$autonomous" >> "$GITHUB_OUTPUT"
echo "only_autonomous=$only_autonomous" >> "$GITHUB_OUTPUT"
