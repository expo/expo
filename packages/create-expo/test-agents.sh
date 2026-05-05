#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CREATE_EXPO="$REPO_ROOT/packages/create-expo"
TEMPLATES_DIR="$REPO_ROOT/templates"
TARBALLS_DIR="/tmp/expo-agent-test/tarballs"
PROJECTS_DIR="/tmp/expo-agent-test/projects"

# Clean up previous runs
rm -rf /tmp/expo-agent-test
mkdir -p "$TARBALLS_DIR" "$PROJECTS_DIR"

# Build create-expo
echo "==> Building create-expo..."
cd "$CREATE_EXPO" && yarn build

# Pack all templates
echo "==> Packing templates..."
for tpl in "$TEMPLATES_DIR"/expo-template-*; do
  name=$(basename "$tpl")
  echo "    $name"
  (cd "$tpl" && npm pack --pack-destination "$TARBALLS_DIR" 2>/dev/null)
done

resolve_tarball() {
  ls "$TARBALLS_DIR"/$1-*.tgz 2>/dev/null | head -1
}

run_test() {
  local name="$1"
  local template="$2"
  shift 2
  local tarball
  tarball=$(resolve_tarball "$template")
  if [ -z "$tarball" ]; then
    echo "SKIP: no tarball for $template"
    return
  fi
  echo ""
  echo "==> Test: $name (template: $template)"
  echo "    Args: $*"
  node "$CREATE_EXPO/build/index.js" "$PROJECTS_DIR/$name" --template "$tarball" --no-install "$@"
}

verify() {
  local project="$PROJECTS_DIR/$1"
  shift
  echo "    Checking $project..."
  local ok=true
  for spec in "$@"; do
    local expect="${spec:0:1}"
    local path="${spec:1}"
    if [ "$expect" = "+" ]; then
      if [ ! -e "$project/$path" ]; then
        echo "    FAIL: expected $path to exist"
        ok=false
      fi
    elif [ "$expect" = "-" ]; then
      if [ -e "$project/$path" ]; then
        echo "    FAIL: expected $path to NOT exist"
        ok=false
      fi
    fi
  done
  $ok && echo "    PASS"
}

verify_content() {
  local file="$PROJECTS_DIR/$1"
  local pattern="$2"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "    PASS: '$pattern' found in $1"
  else
    echo "    FAIL: '$pattern' NOT found in $1"
  fi
}

verify_no_content() {
  local file="$PROJECTS_DIR/$1"
  local pattern="$2"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "    FAIL: '$pattern' should NOT be in $1"
  else
    echo "    PASS: '$pattern' not in $1"
  fi
}

echo ""
echo "========================================"
echo "Test 1: --agents claude (only Claude)"
echo "========================================"
run_test "test-claude" "expo-template-default" --agents claude
verify "test-claude" \
  "+AGENTS.md" "+CLAUDE.md" "+.claude" \
  "-.cursor" "-.windsurf"

echo ""
echo "========================================"
echo "Test 2: --agents claude,cursor"
echo "========================================"
run_test "test-multi" "expo-template-default" --agents claude,cursor
verify "test-multi" \
  "+AGENTS.md" "+CLAUDE.md" "+.claude" "+.cursor" \
  "-.windsurf"

echo ""
echo "========================================"
echo "Test 3: --yes (skip agents, remove all)"
echo "========================================"
run_test "test-yes" "expo-template-default" --yes
verify "test-yes" \
  "-AGENTS.md" "-CLAUDE.md" "-.claude" "-.cursor" "-.windsurf"

echo ""
echo "========================================"
echo "Test 4: --agents copilot (AGENTS.md only)"
echo "========================================"
run_test "test-copilot" "expo-template-default" --agents copilot
verify "test-copilot" \
  "+AGENTS.md" \
  "-CLAUDE.md" "-.claude" "-.cursor" "-.windsurf"

echo ""
echo "========================================"
echo "Test 5: tabs template --agents windsurf"
echo "========================================"
run_test "test-tabs" "expo-template-tabs" --agents windsurf
verify "test-tabs" \
  "+AGENTS.md" "+.windsurf" \
  "-CLAUDE.md" "-.claude" "-.cursor"

echo ""
echo "========================================"
echo "Test 6: Placeholder replacement (npm)"
echo "========================================"
# npm is the default package manager when run via node directly
verify_content "test-claude/AGENTS.md" "Package manager: \*\*npm\*\*"
verify_content "test-claude/AGENTS.md" "npm run start"
verify_no_content "test-claude/AGENTS.md" "{{packageManager}}"
verify_no_content "test-claude/AGENTS.md" "{{projectName}}"

echo ""
echo "========================================"
echo "Test 7: CLAUDE.md contains skills directive"
echo "========================================"
verify_content "test-claude/CLAUDE.md" "claude plugin install expo"

echo ""
echo "========================================"
echo "All automated tests done!"
echo "========================================"
echo ""
echo "To test the interactive prompt manually:"
echo "  node $CREATE_EXPO/build/index.js /tmp/expo-agent-test/projects/test-interactive \\"
echo "    --template \$(ls $TARBALLS_DIR/expo-template-default-*.tgz) --no-install"
echo ""
echo "Clean up with: rm -rf /tmp/expo-agent-test"
