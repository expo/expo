#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_FILE="${PKG_DIR}/benchmark-results.json"
RUNS="${BENCHMARK_RUNS:-1}"

cd "$PKG_DIR"

# macOS date doesn't support %N — use python3 for nanosecond timestamps
now_ns() {
  python3 -c 'import time; print(int(time.time()*1e9))'
}

echo "=== Building create-expo ==="
pnpm run build

ENTRY="$PKG_DIR/build/index.js"
if [ ! -f "$ENTRY" ]; then
  echo "Error: build/index.js not found. Build may have failed."
  exit 1
fi

TMPBASE="$(mktemp -d)"
trap 'rm -rf "$TMPBASE"' EXIT

declare -a SCENARIO_NAMES
declare -a SCENARIO_ARGS

SCENARIO_NAMES+=("default-full-install")
SCENARIO_ARGS+=("--yes")

SCENARIO_NAMES+=("default-no-install")
SCENARIO_ARGS+=("--yes --no-install")

SCENARIO_NAMES+=("template-blank")
SCENARIO_ARGS+=("--yes --template blank --no-install")

SCENARIO_NAMES+=("example-with-router")
SCENARIO_ARGS+=("--yes --example with-router --no-install")

SCENARIO_NAMES+=("warm-cache-no-install")
SCENARIO_ARGS+=("--yes --no-install")

JSON_RESULTS="["

echo ""
echo "=== Running Benchmarks (${RUNS} run(s) each) ==="
echo ""

for i in "${!SCENARIO_NAMES[@]}"; do
  name="${SCENARIO_NAMES[$i]}"
  args="${SCENARIO_ARGS[$i]}"

  echo "--- Scenario: ${name} ---"
  echo "    Args: ${args}"

  for run in $(seq 1 "$RUNS"); do
    PROJ_DIR="${TMPBASE}/${name}-run${run}"
    mkdir -p "$PROJ_DIR"
    TARGET="${PROJ_DIR}/test-app"

    echo "    Run ${run}/${RUNS}..."

    START_NS=$(now_ns)

    # Capture stderr (profile JSON) while discarding stdout (CLI output)
    PROFILE_OUTPUT=$(CREATE_EXPO_PROFILE=json node "$ENTRY" "$TARGET" $args 2>&1 1>/dev/null || true)

    END_NS=$(now_ns)
    WALL_MS=$(python3 -c "print(($END_NS - $START_NS) // 1000000)")

    echo "    Wall time: ${WALL_MS}ms"

    # Extract JSON profile from stderr output (last line that looks like JSON)
    PROFILE_JSON=$(echo "$PROFILE_OUTPUT" | grep '^\{' | tail -1 || echo '{}')

    if [ "$i" -gt 0 ] || [ "$run" -gt 1 ]; then
      JSON_RESULTS+=","
    fi

    JSON_RESULTS+="{\"scenario\":\"${name}\",\"run\":${run},\"wallMs\":${WALL_MS},\"profile\":${PROFILE_JSON}}"
  done

  echo ""
done

JSON_RESULTS+="]"

echo "$JSON_RESULTS" > "$RESULTS_FILE"
echo "=== Results saved to ${RESULTS_FILE} ==="
echo ""

# Print summary table
echo "| Scenario | Wall Time |"
echo "|----------|-----------|"
for i in "${!SCENARIO_NAMES[@]}"; do
  name="${SCENARIO_NAMES[$i]}"
  wall=$(echo "$JSON_RESULTS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in reversed(data):
    if d['scenario'] == '${name}':
        print(f\"{d['wallMs']}ms\")
        break
" 2>/dev/null || echo "N/A")
  echo "| ${name} | ${wall} |"
done
echo ""
echo "Done."
