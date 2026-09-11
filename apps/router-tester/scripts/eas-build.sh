#!/usr/bin/env bash

# Runs `eas build` with a temporary root `.easignore` so the upload contains only
# what this app needs. eas-cli archives the whole git root, and once `.easignore`
# exists it replaces every `.gitignore`, so the file must also list what git
# currently ignores on disk.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
EASIGNORE="$ROOT_DIR/.easignore"

if [ -e "$EASIGNORE" ]; then
  echo "$EASIGNORE already exists, remove it first" >&2
  exit 1
fi
trap 'rm -f "$EASIGNORE"' EXIT

{
  printf '%s\n' '/docs/' '/guides/' '/apps/*' '!/apps/router-tester'
  # Paths git ignores right now, anchored to the root with glob characters escaped.
  git -C "$ROOT_DIR" ls-files --others --ignored --exclude-standard --directory |
    sed -e 's/[][*?]/\\&/g' -e 's|^|/|'
} > "$EASIGNORE"

eas build "$@"
