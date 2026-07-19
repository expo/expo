#!/bin/bash
# Detects whether iOS, Android, or both platforms need to run based on changed files in a PR.
# Uses the GitHub API to fetch changed files — no git history required.
#
# Usage:
#   detect-platform-change.sh <event_name> <repo> <pr_number> <relevant_paths_regex>
#
# Arguments:
#   event_name            - GitHub event name (e.g. "pull_request", "workflow_dispatch")
#   repo                  - GitHub repository full name (e.g. "expo/expo")
#   pr_number             - Pull request number
#   relevant_paths_regex  - Extended regex for paths to consider (e.g. "^(apps/my-app/|packages/foo/)")
#
# Outputs (via set-output):
#   should_run_ios       - "true" or "false"
#   should_run_android   - "true" or "false"
#
# Ignored files: *.md, LICENSE, CHANGELOG, various config dotfiles, *.web.*

set -euo pipefail

EVENT_NAME="${1:?Missing event_name}"
REPO="${2:?Missing repo}"
PR_NUMBER="${3:-}"
RELEVANT_PATHS_REGEX="${4:?Missing relevant_paths_regex}"

echo "EVENT_NAME=$EVENT_NAME"
echo "REPO=$REPO"
echo "PR_NUMBER=$PR_NUMBER"

if [ "$EVENT_NAME" != "pull_request" ]; then
  echo "Not a pull request — running both platforms"
  set-output should_run_ios "true"
  set-output should_run_android "true"
  exit 0
fi

if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" = "undefined" ]; then
  echo "No PR number available — running both platforms"
  set-output should_run_ios "true"
  set-output should_run_android "true"
  exit 0
fi

# Fetch changed files via GitHub API (works on public repos without auth)
API_URL="https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/files?per_page=100"
echo "Fetching changed files: $API_URL"
PAGE=1
CHANGED_FILES=""
while true; do
  RESPONSE=$(curl -sf "${API_URL}&page=$PAGE" || echo "")
  if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "[]" ]; then
    break
  fi
  FILES=$(echo "$RESPONSE" | jq -r '.[].filename' 2>/dev/null || echo "")
  if [ -z "$FILES" ]; then
    break
  fi
  CHANGED_FILES="${CHANGED_FILES}${FILES}"$'\n'
  PAGE=$((PAGE + 1))
done

echo "All changed files:"
echo "$CHANGED_FILES"

# Filter out ignored files (markdown, license, config, etc.)
FILTERED=$(echo "$CHANGED_FILES" \
  | grep -v -E '\.(md)$' \
  | grep -v -E '(LICENSE|CHANGELOG|\.gitignore|\.npmignore|\.eslintrc|\.prettierrc|\.gitattributes|\.watchmanconfig|\.fingerprintignore)' \
  | grep -v -E '\.web\.' \
  || true)

# Only keep files matching the relevant paths regex
RELEVANT=$(echo "$FILTERED" | grep -E "$RELEVANT_PATHS_REGEX" || true)

if [ -z "$RELEVANT" ]; then
  echo "No relevant file changes detected"
  set-output should_run_ios "false"
  set-output should_run_android "false"
  exit 0
fi

echo "Relevant changes:"
echo "$RELEVANT"

# Platform-specific: files under ios/ or android/ dirs
IOS_CHANGES=$(echo "$RELEVANT" | grep -E '/ios/' || true)
ANDROID_CHANGES=$(echo "$RELEVANT" | grep -E '/android/' || true)
# Common: relevant files NOT under ios/ or android/
COMMON_CHANGES=$(echo "$RELEVANT" | grep -v -E '/(ios|android)/' || true)

SHOULD_RUN_IOS="false"
SHOULD_RUN_ANDROID="false"
[ -n "$IOS_CHANGES" ] || [ -n "$COMMON_CHANGES" ] && SHOULD_RUN_IOS="true"
[ -n "$ANDROID_CHANGES" ] || [ -n "$COMMON_CHANGES" ] && SHOULD_RUN_ANDROID="true"

echo ""
echo "should_run_ios=$SHOULD_RUN_IOS"
echo "should_run_android=$SHOULD_RUN_ANDROID"
set-output should_run_ios "$SHOULD_RUN_IOS"
set-output should_run_android "$SHOULD_RUN_ANDROID"
