SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
trap "kill 0" EXIT
(cd "$SCRIPT_DIR/.." && pnpm start) > /dev/null 2>&1 &
(cd "$SCRIPT_DIR/.." && maestro test __tests__/*/**)
