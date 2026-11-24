#!/usr/bin/env bash
# Run `ecr ci` and keep what it posted and logged in this run for ai-review-decision.sh.
#
# ecr writes each comment it posts to $GITHUB_STEP_SUMMARY. Point that at a file of
# this run, then copy the file to the real step summary.
#
# Usage: ai-review-capture.sh <command> [args...]
# Writes $RUNNER_TEMP/ai-review-posted.md and $RUNNER_TEMP/ai-review-ecr.log.
# Exits with the command's status.
set -uo pipefail

summary=${GITHUB_STEP_SUMMARY:-/dev/null}
export GITHUB_STEP_SUMMARY=$RUNNER_TEMP/ai-review-posted.md
: > "$GITHUB_STEP_SUMMARY"

# Only stderr goes through tee. A pipeline waits for tee, so the log is whole.
{ "$@" 2>&1 1>&3 3>&- | tee "$RUNNER_TEMP/ai-review-ecr.log" >&2; } 3>&1
status=${PIPESTATUS[0]}

cat "$GITHUB_STEP_SUMMARY" >> "$summary"
exit "$status"
