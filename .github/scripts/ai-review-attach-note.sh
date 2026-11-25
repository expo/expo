#!/usr/bin/env bash
# Tell Expo staff how to reopen this review.
#
# ecr rewrites its comment on every run, so this runs after ecr and after the
# auto-count marker. The line is appended, and a second run leaves it once.
#
# Env: GH_TOKEN, REPO, PR, BOT_LOGIN.
set -euo pipefail

note_line() {
  printf 'Expo staff can reopen a stored review with `ecr attach --pr %s` from a checkout of the reviewed commit.' "$1"
}

# Print the body with the line at the end, or the body unchanged when it is there.
append_note() {
  local body=$1 pr=$2
  local line
  line=$(note_line "$pr")
  if [[ $body == *"$line"* ]]; then
    printf '%s' "$body"
    return 0
  fi
  printf '%s\n\n%s\n' "$body" "$line"
}

# True when the comment's embedded ecr state holds a review. A "not reviewed" comment,
# or a routed comment where every scope failed, has no stored session to reopen.
has_review() {
  local state
  state=$(grep -o 'expo-ai-code-reviewer:state=[A-Za-z0-9+/=]*' <<< "$1" | tail -n 1) || return 1
  state=${state#*:state=}
  [ -n "$state" ] || return 1
  base64 --decode <<< "$state" 2>/dev/null | jq -e '
    .review.couldNotComplete != true
    and ((.scopes // []) as $scopes
      | ($scopes | length) == 0 or any($scopes[]; .review.couldNotComplete != true))
  ' > /dev/null 2>&1
}

if [ "${1:-}" = --self-test ]; then
  state_marker() { printf '<!-- expo-ai-code-reviewer:state=%s -->' "$(printf '%s' "$1" | base64 | tr -d '\n')"; }
  reviewed=$(state_marker '{"review":{"decision":"approve","findings":[]}}')
  body=$'Review\n<!-- expo-ai-code-reviewer -->\n'"$reviewed"
  out=$(append_note "$body" 12)
  [[ $out == *'ecr attach --pr 12'* ]]
  [ "$(append_note "$out" 12)" = "$out" ]
  [[ $out == *"$reviewed"* ]]
  has_review "$body"
  has_review "x $(state_marker '{"review":{"couldNotComplete":true}}')" && exit 1
  has_review "x $(state_marker '{"review":{},"scopes":[{"review":{"couldNotComplete":true}}]}')" && exit 1
  has_review "x $(state_marker '{"review":{},"scopes":[{"review":{"couldNotComplete":true}},{"review":{}}]}')"
  has_review 'Review <!-- expo-ai-code-reviewer -->' && exit 1
  echo "ai-review-attach-note self-test ok"
  exit 0
fi

: "${GH_TOKEN:?}" "${REPO:?}" "${PR:?}" "${BOT_LOGIN:?}"
case "$PR" in
  ''|*[!0-9]*)
    echo "attach note: no pull request number"
    exit 0
    ;;
esac

# Issue comments, not inline review comments. The marker is the one ecr writes.
# :inline: is a finding thread, and the line does not belong there.
ids=$(
  gh api --paginate "repos/${REPO}/issues/${PR}/comments?per_page=100" \
    --jq ".[] | select(.user.login == \"${BOT_LOGIN}\" and (.body | contains(\"<!-- expo-ai-code-reviewer\")) and (.body | contains(\":inline:\") | not) and (.body | contains(\"ecr attach --pr ${PR}\") | not)) | .id"
) || {
  echo "attach note: could not list comments"
  exit 0
}

for id in $ids; do
  body=$(gh api "repos/${REPO}/issues/comments/${id}" --jq .body) || continue
  if ! has_review "$body"; then
    echo "attach note: comment ${id} holds no review, so it gets no note"
    continue
  fi
  updated=$(append_note "$body" "$PR")
  printf '%s' "$updated" | jq -Rs '{body: .}' |
    gh api --method PATCH "repos/${REPO}/issues/comments/${id}" --input - >/dev/null
  echo "attach note: updated comment ${id}"
done
