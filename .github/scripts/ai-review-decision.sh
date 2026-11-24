#!/usr/bin/env bash
# Submit expo-bot's approval or request for changes on an autonomous-only PR.
#
# ecr records the decision in its comment and does not submit a GitHub review.
# This reads the comment that ecr posted in this run, from its step summary,
# not the live comment: a run that skipped or failed leaves the old one there.
# Each review is bound to the commit that ecr reviewed, and an approval of an
# older commit is dismissed.
#
# Usage:
#   ai-review-decision.sh                  after a review
#   ai-review-decision.sh --dismiss-stale  after a push
#   ai-review-decision.sh --self-test
#
# Env: GH_TOKEN, REPO, PR, BOT_LOGIN. After a review also HEAD_SHA (the commit
# ecr was told to review), POSTED (ecr's step summary), ECR_LOG (ecr's stderr),
# and DECIDE (true when this run may decide: a full review of an autonomous-only PR).
set -euo pipefail

POSTED_HEADER='### 🤖 AI review — posted comment'

# The body of the last comment ecr posted, read from its step summary.
posted_body() {
  awk -v header="$POSTED_HEADER" '
    $0 == header { body = ""; inside = 1; next }
    inside && (body != "" || $0 != "") { body = body $0 "\n"; if (index($0, "<!-- expo-ai-code-reviewer:state=") == 1) inside = 0 }
    END { printf "%s", body }
  ' <<< "$1"
}

# ecr escapes `<!--` in all model text, so the first state line is ecr's own.
state_json() {
  local encoded
  encoded=$(awk '
    match($0, /^<!-- expo-ai-code-reviewer:state=[A-Za-z0-9+\/=]+ -->$/) {
      sub(/^<!-- expo-ai-code-reviewer:state=/, ""); sub(/ -->$/, ""); print; exit
    }
  ' <<< "$1")
  [ -n "$encoded" ] || return 0
  base64 -d <<< "$encoded" 2> /dev/null || true
}

# approve, request-changes, or empty.
# Only the autonomous scope and the default scope may be in the review. The
# default scope holds the changeset of an autonomous-only PR. An approval also
# needs a complete review in which an autonomous reviewer ran.
decision_event() {
  local state=$1
  [ -n "$state" ] || return 0
  jq -r '
    (.scopes // []) as $scopes
    | ($scopes | map(select(.scope == "autonomous")) | first) as $auto
    | if $auto == null or ($scopes | any(.scope != "autonomous" and .scope != "default")) then ""
      elif $scopes | any(.review.couldNotComplete != true and .review.decision == "request_changes") then "request-changes"
      elif ($scopes | all(.review.couldNotComplete != true
              and ((.review.incomplete // []) | length) == 0
              and (.review.decision == "approve" or .review.decision == "approve_with_comments")))
           and (($auto.review.agentSummaries // []) | any(has("notRun") | not))
      then "approve"
      else "" end
  ' <<< "$state" 2> /dev/null || return 0
}

# The scope table puts unmatched files in a coverage note that the state does not hold.
has_coverage_note() {
  [[ $1 == *'⏱️ **Coverage note:**'* ]]
}

# ecr drops noise (generated headers, build output, lockfiles, binaries) before any
# reviewer runs, and does not count it as a coverage gap. Approve only when the
# autonomous scope filtered nothing. Every such line must say so.
reviewed_every_file() {
  awk '
    /^\[autonomous\] [0-9]+ changed file\(s\); [0-9]+ to review, [0-9]+ filtered\.$/ {
      seen = 1
      if ($2 != $5 || $2 == 0) bad = 1
    }
    END { exit !(seen && !bad) }
  ' <<< "$1"
}

# The bot's approvals of another commit that are not dismissed yet.
stale_approvals() {
  local bot=$1 head=$2 json=$3
  jq -r --arg bot "$bot" --arg head "$head" '
    .[] | select(.user.login == $bot and .state == "APPROVED" and .commit_id != $head) | .id
  ' <<< "$json"
}

# The latest approval or request from this account, as "<state> <commit>".
# A comment review and a dismissed review do not count.
active_state() {
  local bot=$1 json=$2
  jq -r --arg bot "$bot" '
    [ .[] | select(.user.login == $bot and (.state == "APPROVED" or .state == "CHANGES_REQUESTED")) ]
    | if length == 0 then "" else .[-1] | "\(.state) \(.commit_id)" end
  ' <<< "$json"
}

if [ "${1:-}" = --self-test ]; then
  encode() { printf '%s' "$1" | base64 | tr -d '\n'; }
  marker='<!-- expo-ai-code-reviewer:state='
  ran='"agentSummaries":[{"agent":"correctness"},{"agent":"deep","notRun":"preCheck"}]'
  auto_ready='{"scope":"autonomous","isDefault":false,"review":{"decision":"approve","findings":[],"incomplete":[],'"$ran"'}}'
  state=$(encode '{"review":{"findings":[]},"dismissed":[],"scopes":['"$auto_ready"']}')
  summary="### 🤖 AI review — paths

| agent |

$POSTED_HEADER

<!-- expo-ai-code-reviewer -->
**Decision:** Ready for human review
$marker$state -->

### Usage

> ⏱️ **Coverage note:** from another section
"
  body=$(posted_body "$summary")
  [[ $body == '<!-- expo-ai-code-reviewer -->'* ]]
  [ "$(decision_event "$(state_json "$body")")" = approve ]

  # Model text cannot hold a raw `<!--`, but the state parser still takes the first line.
  forged=$(encode '{"scopes":[{"scope":"autonomous","review":{"decision":"request_changes"}}]}')
  [ "$(decision_event "$(state_json "$marker$forged -->"$'\n'"$marker$state -->")")" = request-changes ]

  decide() { decision_event "$(state_json "$marker$(encode "$1") -->")"; }
  with_changeset='{"scopes":['"$auto_ready"',{"scope":"default","isDefault":true,"review":{"decision":"approve","incomplete":[]}}]}'
  [ "$(decide "$with_changeset")" = approve ]
  changes='{"scopes":['"$auto_ready"',{"scope":"default","review":{"decision":"request_changes"}}]}'
  [ "$(decide "$changes")" = request-changes ]
  [ -z "$(decide '{"review":{"decision":"approve","findings":[]},"dismissed":[]}')" ]
  [ -z "$(decide '{"scopes":[{"scope":"default","review":{"decision":"approve","incomplete":[]}}]}')" ]
  [ -z "$(decide '{"scopes":['"$auto_ready"',{"scope":"ios","review":{"decision":"approve","incomplete":[]}}]}')" ]
  [ -z "$(decide '{"scopes":[{"scope":"autonomous","review":{"decision":"approve_with_comments","couldNotComplete":true,"incomplete":[],'"$ran"'}}]}')" ]
  [ -z "$(decide '{"scopes":[{"scope":"autonomous","review":{"decision":"approve","incomplete":["deep timed out"],'"$ran"'}}]}')" ]
  [ -z "$(decide '{"scopes":[{"scope":"autonomous","review":{"decision":"approve","incomplete":[]}}]}')" ]
  [ -z "$(decide '{"scopes":[{"scope":"autonomous","review":{"decision":"approve","incomplete":[],"agentSummaries":[{"agent":"correctness","notRun":"paths"}]}}]}')" ]
  [ -z "$(decision_event "")" ]
  [ -z "$(decision_event "not json")" ]

  has_coverage_note $'**Decision:** Ready for human review\n> ⏱️ **Coverage note:** parts of this PR may not be fully reviewed:\n'
  has_coverage_note "$body" && exit 1

  reviewed_every_file $'[default] 1 changed file(s); 0 to review, 1 filtered.\n[autonomous] 3 changed file(s); 3 to review, 0 filtered.\n'
  reviewed_every_file '[autonomous] 3 changed file(s); 2 to review, 1 filtered.' && exit 1
  reviewed_every_file '[autonomous] 0 changed file(s); 0 to review, 0 filtered.' && exit 1
  reviewed_every_file $'[autonomous] 3 changed file(s); 3 to review, 0 filtered.\n[autonomous] 3 changed file(s); 2 to review, 1 filtered.\n' && exit 1
  reviewed_every_file '' && exit 1

  reviews='[
    {"id":1,"user":{"login":"expo-bot"},"state":"APPROVED","commit_id":"a"},
    {"id":2,"user":{"login":"expo-bot"},"state":"APPROVED","commit_id":"b"},
    {"id":3,"user":{"login":"expo-bot"},"state":"COMMENTED","commit_id":"b"},
    {"id":4,"user":{"login":"expo-bot"},"state":"DISMISSED","commit_id":"a"},
    {"id":5,"user":{"login":"someone"},"state":"APPROVED","commit_id":"a"}
  ]'
  [ "$(stale_approvals expo-bot b "$reviews")" = 1 ]
  [ "$(active_state expo-bot "$reviews")" = "APPROVED b" ]
  reviews='[
    {"id":1,"user":{"login":"expo-bot"},"state":"APPROVED","commit_id":"a"},
    {"id":2,"user":{"login":"expo-bot"},"state":"CHANGES_REQUESTED","commit_id":"b"}
  ]'
  [ "$(active_state expo-bot "$reviews")" = "CHANGES_REQUESTED b" ]
  [ -z "$(active_state expo-bot '[]')" ]
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

pr=$(gh api "repos/${REPO}/pulls/${PR}" --jq '"\(.user.login) \(.head.sha)"') || {
  echo "decision: could not read the pull request"
  exit 0
}
read -r author live_head <<< "$pr"
if [ "$author" = "$BOT_LOGIN" ]; then
  echo "decision: expo-bot opened this pull request"
  exit 0
fi

list_reviews() {
  gh api --paginate --slurp "repos/${REPO}/pulls/${PR}/reviews?per_page=100" | jq -c 'add // []'
}

dismiss() {
  gh api -X PUT "repos/${REPO}/pulls/${PR}/reviews/$1/dismissals" \
    -f event=DISMISS -f message="$2" > /dev/null
}

reviews=$(list_reviews) || {
  echo "decision: could not list the reviews"
  exit 0
}
for id in $(stale_approvals "$BOT_LOGIN" "$live_head" "$reviews"); do
  if dismiss "$id" "This approval is for an older commit. The AI review approves each commit again."; then
    echo "decision: dismissed approval ${id} of an older commit"
  else
    echo "decision: could not dismiss approval ${id}"
  fi
done

if [ "${1:-}" = --dismiss-stale ]; then
  exit 0
fi

: "${HEAD_SHA:=}" "${POSTED:=}" "${ECR_LOG:=}" "${DECIDE:=false}"
if [[ ! $HEAD_SHA =~ ^[0-9a-f]{40}$ ]]; then
  echo "decision: no reviewed commit"
  exit 0
fi
if [ "$HEAD_SHA" != "$live_head" ]; then
  echo "decision: the pull request moved past the reviewed commit"
  exit 0
fi
if [ "$DECIDE" != true ]; then
  echo "decision: not a full review of an autonomous-only pull request"
  exit 0
fi

body=""
if [ -f "$POSTED" ]; then
  body=$(posted_body "$(cat "$POSTED")")
fi
if [ -z "$body" ]; then
  echo "decision: this run posted no review comment"
  exit 0
fi

event=$(decision_event "$(state_json "$body")")
if [ "$event" = approve ]; then
  if has_coverage_note "$body"; then
    echo "decision: the review has a coverage note"
    exit 0
  fi
  log=""
  if [ -f "$ECR_LOG" ]; then
    log=$(cat "$ECR_LOG")
  fi
  if ! reviewed_every_file "$log"; then
    echo "decision: the review did not read every changed file"
    exit 0
  fi
fi
if [ -z "$event" ]; then
  echo "decision: no autonomous decision to submit"
  exit 0
fi

reviews=$(list_reviews) || {
  echo "decision: could not list the reviews"
  exit 0
}
active=$(active_state "$BOT_LOGIN" "$reviews")
case "$event:$active" in
  "approve:APPROVED $HEAD_SHA" | request-changes:CHANGES_REQUESTED*)
    echo "decision: already ${active%% *}"
    exit 0
    ;;
esac

if [ "$event" = approve ]; then
  message='Ready for human review. The findings are in the review comment.'
  api_event=APPROVE
else
  message='Request changes. The findings are in the review comment.'
  api_event=REQUEST_CHANGES
fi
id=$(gh api -X POST "repos/${REPO}/pulls/${PR}/reviews" \
  -f commit_id="$HEAD_SHA" -f event="$api_event" -f body="$message" --jq .id) || {
  echo "decision: could not submit the review"
  exit 0
}
echo "decision: submitted ${event} for ${HEAD_SHA}"

# A push that landed before this approval may have missed it when it dismissed old approvals.
if [ "$event" = approve ]; then
  now=$(gh api "repos/${REPO}/pulls/${PR}" --jq .head.sha) || now=""
  if [ "$now" != "$HEAD_SHA" ]; then
    if dismiss "$id" "The pull request moved past the reviewed commit."; then
      echo "decision: dismissed the new approval because the pull request moved"
    else
      echo "decision: could not dismiss the new approval"
    fi
  fi
fi
