#!/bin/bash
# Decides which packages to pass to `et prebuild` for the iOS XCFramework smoke test.
# Uses the GitHub API to fetch changed files — no git history required.
#
# Usage:
#   detect-prebuild-packages.sh <event_name> <repo> <pr_number> <dispatch_input>
#
# Outputs (via set-output):
#   packages - space-separated package names, or empty to skip the smoke test
#
# Logic:
#   - workflow_dispatch: use dispatch_input if provided, else default pair.
#   - PR where expo-modules-core changed: run expo-modules-core + expo-media-library (+ any other changed eligible packages).
#   - PR where other eligible packages changed: run expo-modules-core + those packages.
#   - PR that only touched tools/src/prebuilds/** or this workflow file: run expo-modules-core alone.
#   - PR that only touched packages without spm.config.json: skip (empty).

set -euo pipefail

EVENT_NAME="${1:?Missing event_name}"
REPO="${2:?Missing repo}"
PR_NUMBER="${3:-}"
DISPATCH_INPUT="${4:-}"

DEFAULT_PACKAGES="expo-modules-core expo-media-library"
REPO_ROOT="../.."
WORKFLOW_PATH="apps/expo-workflow-testing/.eas/workflows/ios-prebuild-xcframeworks-smoke.yml"

echo "EVENT_NAME=$EVENT_NAME"
echo "REPO=$REPO"
echo "PR_NUMBER=$PR_NUMBER"

if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
  PKGS=$(echo "${DISPATCH_INPUT:-$DEFAULT_PACKAGES}" | xargs)
  echo "Dispatch packages: $PKGS"
  set-output packages "$PKGS"
  exit 0
fi

if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" = "undefined" ]; then
  echo "No PR number — using default: $DEFAULT_PACKAGES"
  set-output packages "$DEFAULT_PACKAGES"
  exit 0
fi

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

echo "Changed files:"
echo "$CHANGED_FILES"

CHANGED_PKGS=$(echo "$CHANGED_FILES" | awk -F/ '$1=="packages" && NF>=2 {print $2}' | sort -u)

ELIGIBLE=()
for pkg in $CHANGED_PKGS; do
  if [ -f "$REPO_ROOT/packages/$pkg/spm.config.json" ]; then
    ELIGIBLE+=("$pkg")
  fi
done

TOOLS_OR_WORKFLOW_CHANGED=false
if echo "$CHANGED_FILES" | grep -qE "^(tools/src/prebuilds/|${WORKFLOW_PATH}\$)"; then
  TOOLS_OR_WORKFLOW_CHANGED=true
fi

MC_CHANGED=false
for p in "${ELIGIBLE[@]:-}"; do
  [ "$p" = "expo-modules-core" ] && MC_CHANGED=true
done

if [ "${#ELIGIBLE[@]}" -eq 0 ]; then
  if [ "$TOOLS_OR_WORKFLOW_CHANGED" = "true" ]; then
    PKGS="expo-modules-core"
  else
    PKGS=""
  fi
elif [ "$MC_CHANGED" = "true" ]; then
  SET="${ELIGIBLE[*]} expo-media-library"
  PKGS=$(echo "$SET" | tr ' ' '\n' | awk 'NF && !x[$0]++' | paste -sd ' ' -)
else
  SET="expo-modules-core ${ELIGIBLE[*]}"
  PKGS=$(echo "$SET" | tr ' ' '\n' | awk 'NF && !x[$0]++' | paste -sd ' ' -)
fi

echo "Resolved packages: ${PKGS:-<none — skipping smoke test>}"
# set-output rejects an empty VALUE (exit 2), so emit a sentinel the
# workflow can compare against in its `if:` conditions.
set-output packages "${PKGS:-none}"
