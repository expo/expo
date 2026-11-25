#!/usr/bin/env bash
# Count the automatic AI reviews of one PR, and stop them at a limit.
#
# The count is a hidden marker at the end of the reviewer's own PR comment. Only
# expo-bot and maintainers can edit that comment, so a PR author cannot reset it.
# ecr rewrites the whole comment on each review and drops the marker. So `record`
# writes the marker back only when the comment changed after `check` and the marker is
# gone: then ecr wrote the comment, and the review ran. A run that never reached ecr
# leaves the comment as `check` saw it, and does not count.
# A review that ecr runs without `record`, such as `@expo-bot review`, resets the count.
#
#   check    Writes skip=true|false, next=<count> and seen=<comment updated_at, or none>
#            to $GITHUB_OUTPUT. When it cannot read the count it skips the review,
#            because the review would reset it.
#   record   Writes NEXT into the comment when ecr rewrote it after SEEN.
#   read     Writes count=<count> to $GITHUB_OUTPUT, or nothing when there is none.
#   restore  Writes COUNT back into the comment when the marker is gone.
#
# Env: GH_TOKEN, REPO, PR, BOT_LOGIN, COMMENT_TAG, and for `check`: COUNTED, MAX and
# SENDER, for `record`: NEXT and SEEN, for `restore`: COUNT.
set -euo pipefail

START='<!-- expo-ai-review-auto-count:start -->'

# The body without our block. ecr escapes `<!--` in all PR text, so the start
# marker can only be ours.
strip_block() {
  awk -v start="$START" 'index($0, start) { exit } { print }'
}

read_count() {
  { grep -o '<!-- expo-ai-review-auto-count=[0-9]* -->' || true; } | tail -n 1 | tr -dc '0-9'
}

# Prints the body with a new block: an optional visible note and the count.
with_block() {
  local body=$1 count=$2 note=${3:-}
  printf '%s\n\n%s\n' "$(strip_block <<< "$body")" "$START"
  [ -z "$note" ] || printf '%s\n' "$note"
  printf '<!-- expo-ai-review-auto-count=%s -->\n' "$count"
}

if [ "${1:-}" = --self-test ]; then
  body=$'Review\n<!-- tag:state=abc -->'
  marked=$(with_block "$body" 3)
  [ "$(read_count <<< "$marked")" = 3 ]
  remarked=$(with_block "$marked" 4 'Paused.')
  [ "$(read_count <<< "$remarked")" = 4 ]
  [ "$(grep -c 'expo-ai-review-auto-count:start' <<< "$remarked")" = 1 ]
  [ "$(strip_block <<< "$remarked")" = "$body" ]
  [ -z "$(read_count <<< "$body")" ]
  [ -z "$(read_count <<< "")" ]
  echo "ai-review-auto-count self-test ok"
  exit 0
fi

: "${GH_TOKEN:?}" "${REPO:?}" "${PR:?}" "${BOT_LOGIN:?}" "${COMMENT_TAG:?}"
marker="<!-- $COMMENT_TAG -->"

# The id of the reviewer's comment, as ecr picks it: the last one by the bot with the
# marker. Prints nothing when there is none, and fails when the list cannot be read.
comment_id() {
  local ids
  ids=$(gh api --paginate "repos/$REPO/issues/$PR/comments" \
    --jq ".[] | select(.user.login == \"$BOT_LOGIN\" and (.body | contains(\"$marker\"))) | .id") ||
    return 1
  tail -n 1 <<< "$ids"
}

# Fails unless it read the reviewer's comment, so a failed read never becomes an empty
# body that a PATCH would write over the review.
read_body() {
  local body
  body=$(gh api "repos/$REPO/issues/comments/$1" --jq .body) || return 1
  [[ $body == *"$marker"* ]] || return 1
  printf '%s' "$body"
}

comment_updated_at() {
  gh api "repos/$REPO/issues/comments/$1" --jq .updated_at
}

# The body goes through stdin: a long review can exceed the size of one argument.
write_body() {
  printf '%s' "$2" | jq -Rs '{body: .}' |
    gh api -X PATCH "repos/$REPO/issues/comments/$1" --input - > /dev/null
}

can_write() {
  case "$(gh api "repos/$REPO/collaborators/$1/permission" --jq .permission 2>/dev/null || true)" in
    admin | maintain | write) return 0 ;;
  esac
  return 1
}

# Writes the count when the marker is gone. With SEEN set, it also needs the comment to
# have changed after `check`, so a run cancelled before ecr wrote does not count.
# Retries, because a lost write resets it.
write_count() {
  local count=$1 seen=${2:-} attempt id body updated
  for attempt in 1 2 3; do
    [ "$attempt" = 1 ] || sleep 5
    id=$(comment_id) || continue
    if [ -z "$id" ]; then
      echo "There is no AI review comment, so this run is not counted."
      return 0
    fi
    if [ -n "$seen" ] && [ "$seen" != none ]; then
      updated=$(comment_updated_at "$id") || continue
      if [ "$updated" = "$seen" ]; then
        echo "The AI review comment did not change after the check, so ecr did not write it. This run is not counted."
        return 0
      fi
    fi
    body=$(read_body "$id") || continue
    if [ -n "$(read_count <<< "$body")" ]; then
      echo "The AI review comment still has its count, so ecr did not rewrite it. This run is not counted."
      return 0
    fi
    write_body "$id" "$(with_block "$body" "$count")" && return 0
  done
  echo "::warning::Could not write the AI review count. The next automatic review starts the count again."
  return 1
}

case "${1:-}" in
  check)
    : "${COUNTED:?}" "${MAX:?}" "${SENDER:?}"
    if ! [[ $MAX =~ ^[1-9][0-9]*$ ]]; then
      echo "::warning::AI_REVIEW_MAX_AUTO is not a positive number (\"$MAX\"). Using 5."
      MAX=5
    fi
    # A label event resets the count, but only from a writer, such as expo-bot on a
    # review request. Triage access can add a label too.
    if [ "$COUNTED" != true ] && can_write "$SENDER"; then
      echo "skip=false" >> "$GITHUB_OUTPUT"
      echo "next=0" >> "$GITHUB_OUTPUT"
      exit 0
    fi
    id="" body=""
    if ! id=$(comment_id) || { [ -n "$id" ] && ! body=$(read_body "$id"); }; then
      echo "::warning::Could not read the automatic AI review count. Skipping this review, because it would reset the count. A maintainer can comment \`@expo-bot review\`."
      echo "skip=true" >> "$GITHUB_OUTPUT"
      exit 0
    fi
    seen=none
    if [ -n "$id" ] && ! seen=$(comment_updated_at "$id"); then
      echo "::warning::Could not read the AI review comment. Skipping this review, because it could not be counted. A maintainer can comment \`@expo-bot review\`."
      echo "skip=true" >> "$GITHUB_OUTPUT"
      exit 0
    fi
    count=$(read_count <<< "$body")
    count=${count:-0}
    if [ "$count" -ge "$MAX" ]; then
      echo "Automatic AI review limit reached ($count of $MAX). Skipping this review."
      note="> [!NOTE]
> Automatic AI reviews are paused on this PR: it used $count of $MAX. To review the latest commit, a maintainer can comment \`@expo-bot review\` or re-request expo-bot's review. That also resets the count."
      write_body "$id" "$(with_block "$body" "$count" "$note")" ||
        echo "::warning::Could not add the limit note to the AI review comment."
      echo "skip=true" >> "$GITHUB_OUTPUT"
    else
      echo "Automatic AI review $((count + 1)) of $MAX."
      {
        echo "skip=false"
        echo "next=$((count + 1))"
        echo "seen=$seen"
      } >> "$GITHUB_OUTPUT"
    fi
    ;;
  record)
    : "${NEXT:?}"
    write_count "$NEXT" "${SEEN:-}"
    ;;
  restore)
    : "${COUNT:?}"
    write_count "$COUNT"
    ;;
  read)
    id=$(comment_id) || exit 0
    [ -n "$id" ] || exit 0
    body=$(read_body "$id") || exit 0
    count=$(read_count <<< "$body")
    [ -z "$count" ] || echo "count=$count" >> "$GITHUB_OUTPUT"
    ;;
  *)
    echo "usage: $0 check|record|read|restore|--self-test" >&2
    exit 2
    ;;
esac
