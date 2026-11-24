#!/usr/bin/env bash
# Submit expo-bot's approval or request for changes on an autonomous-only PR.
#
# ecr records the decision in its comment and does not submit a GitHub review.
# This runs after that comment. A mixed PR, a review that did not finish, and a
# review of selected agents are left alone. A second run submits nothing when
# the current review already matches.
#
# Env: GH_TOKEN, REPO, PR, BOT_LOGIN.
set -euo pipefail

# approve, request-changes, or empty.
decision_event() {
  local line
  line=$(printf '%s\n' "$1" | sed -n 's/^\*\*Decision:\*\*[[:space:]]*//p' | head -n 1)
  line=${line%$'\r'}
  case "$line" in
    "Request changes") printf '%s' request-changes ;;
    "Ready for human review" | "Ready for human review (with comments)") printf '%s' approve ;;
    *) printf '%s' "" ;;
  esac
}

# True when this comment is a finished autonomous review with that event.
# A coverage gap or a "No review" scope must not become an approval. Another
# scope in the comment means the PR was not autonomous-only.
decision_applies() {
  local body=$1 event=$2
  [[ $body != *'| default |'* ]] || return 1
  [[ $body != *'| autonomous | No review |'* ]] || return 1
  if [ "$event" = approve ]; then
    [[ $body != *'⏱️ **Coverage note:**'* ]] || return 1
  fi
  return 0
}

# The latest approval or request from this account. A comment review and a
# dismissed review do not count.
active_state() {
  local bot=$1 json=$2
  jq -r --arg bot "$bot" '
    [ .[]
      | select(.author.login == $bot and (.state == "APPROVED" or .state == "CHANGES_REQUESTED"))
    ]
    | if length == 0 then "" else .[-1].state end
  ' <<< "$json"
}

if [ "${1:-}" = --self-test ]; then
  ready=$'<!-- expo-ai-code-reviewer -->\n## 🤖 AI code review\n\n**Decision:** Ready for human review\n\n| Scope | Decision | Findings |\n| --- | --- | --- |\n| autonomous | Ready for human review | 0 |\n'
  [ "$(decision_event "$ready")" = approve ]
  decision_applies "$ready" approve
  changes=$'**Decision:** Request changes\n\n| autonomous | Request changes | 1 |\n'
  [ "$(decision_event "$changes")" = request-changes ]
  decision_applies "$changes" request-changes
  [ -z "$(decision_event $'**Decision:** No review\n')" ]
  covered=$'**Decision:** Ready for human review\n\n> ⏱️ **Coverage note:** parts of this PR may not be fully reviewed:\n'
  decision_applies "$covered" approve && exit 1
  mixed=$'**Decision:** Request changes\n\n| default | Request changes | 1 |\n| autonomous | Ready for human review | 0 |\n'
  decision_applies "$mixed" request-changes && exit 1
  unfinished=$'**Decision:** Ready for human review (with comments)\n\n| autonomous | No review | 0 |\n'
  [ "$(decision_event "$unfinished")" = approve ]
  decision_applies "$unfinished" approve && exit 1
  reviews='[
    {"author":{"login":"expo-bot"},"state":"APPROVED"},
    {"author":{"login":"expo-bot"},"state":"COMMENTED"},
    {"author":{"login":"expo-bot"},"state":"DISMISSED"},
    {"author":{"login":"someone"},"state":"CHANGES_REQUESTED"}
  ]'
  [ "$(active_state expo-bot "$reviews")" = APPROVED ]
  reviews='[
    {"author":{"login":"expo-bot"},"state":"APPROVED"},
    {"author":{"login":"expo-bot"},"state":"CHANGES_REQUESTED"}
  ]'
  [ "$(active_state expo-bot "$reviews")" = CHANGES_REQUESTED ]
  echo "ai-review-decision self-test ok"
  exit 0
fi

: "${GH_TOKEN:?}" "${REPO:?}" "${PR:?}" "${BOT_LOGIN:?}"
case "$PR" in
  '' | *[!0-9]*)
    echo "decision: no pull request number"
    exit 0
    ;;
esac

body=$(
  gh api --paginate "repos/${REPO}/issues/${PR}/comments?per_page=100" \
    --jq "[.[] | select(.user.login == \"${BOT_LOGIN}\" and (.body | contains(\"<!-- expo-ai-code-reviewer\")) and (.body | contains(\":inline:\") | not))] | last | .body // empty"
) || {
  echo "decision: could not list comments"
  exit 0
}
if [ -z "$body" ]; then
  echo "decision: no review comment"
  exit 0
fi

event=$(decision_event "$body")
if [ -z "$event" ]; then
  echo "decision: no finished decision"
  exit 0
fi
if ! decision_applies "$body" "$event"; then
  echo "decision: not an autonomous review to submit"
  exit 0
fi

meta=$(gh pr view "$PR" --repo "$REPO" --json author,reviews) || {
  echo "decision: could not read the pull request"
  exit 0
}
author=$(jq -r '.author.login' <<< "$meta")
if [ "$author" = "$BOT_LOGIN" ]; then
  echo "decision: expo-bot opened this pull request"
  exit 0
fi

active=$(active_state "$BOT_LOGIN" "$(jq -c '.reviews' <<< "$meta")")
case "$event:$active" in
  approve:APPROVED | request-changes:CHANGES_REQUESTED)
    echo "decision: already ${active}"
    exit 0
    ;;
esac

if [ "$event" = approve ]; then
  message='Ready for human review. The findings are in the review comment.'
  args=(--approve)
else
  message='Request changes. The findings are in the review comment.'
  args=(--request-changes)
fi
if ! gh pr review "$PR" --repo "$REPO" "${args[@]}" --body "$message"; then
  echo "decision: could not submit the review"
  exit 0
fi
echo "decision: submitted ${event}"
