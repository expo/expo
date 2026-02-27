PR_NUMBER=43407
REPO="expo/expo"

# Use GitHub API to get changed files — no git history needed
echo "Fetching changed files for PR #$PR_NUMBER via GitHub API..."
PAGE=1
CHANGED_FILES=""
while true; do
  RESPONSE=$(curl -sf "https://api.github.com/repos/$REPO/pulls/$PR_NUMBER/files?per_page=100&page=$PAGE" || echo "")
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

# Filter out ignored files (markdown, license, config, etc.)
FILTERED=$(echo "$CHANGED_FILES" \
  | grep -v -E '\.(md)$' \
  | grep -v -E '(LICENSE|CHANGELOG|\.gitignore|\.npmignore|\.eslintrc|\.prettierrc|\.gitattributes|\.watchmanconfig|\.fingerprintignore)' \
  | grep -v -E '\.web\.' \
  || true)

# Only keep files in relevant paths
RELEVANT=$(echo "$FILTERED" \
  | grep -E '^(apps/brownfield-tester/|packages/(expo|expo-modules-core|expo-dev-client|expo-updates)/|apps/expo-workflow-testing/\.eas/workflows/test-suite-brownfield\.yml)' \
  || true)

if [ -z "$RELEVANT" ]; then
  echo "No relevant file changes detected"
  set-output should_run_ios "false"
  set-output should_run_android "false"
  exit 0
fi