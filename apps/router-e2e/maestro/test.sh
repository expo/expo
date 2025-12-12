
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
trap "kill 0" EXIT
(cd "$SCRIPT_DIR/../../bare-expo/e2e/image-comparison" && yarn start) > /dev/null 2>&1 &
(cd "$SCRIPT_DIR/.." && yarn start:native-navigation) > /dev/null 2>&1 &
(cd "$SCRIPT_DIR/../__e2e__/native-navigation" && maestro test __tests__/*/**)