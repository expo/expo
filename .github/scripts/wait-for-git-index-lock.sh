#!/usr/bin/env bash
# Wait up to 30 seconds for .git/index.lock to go away. Remove the lock only when no git
# process runs: deleting the lock while a git process still holds it can corrupt the index.
set -euo pipefail

for i in $(seq 1 30); do
  [ -e .git/index.lock ] || exit 0
  pgrep -a -x git && rc=0 || rc=$?
  if [ "$rc" -eq 1 ]; then
    echo "Removing a stale .git/index.lock. No Git process is running."
    stat -c 'size=%s mtime=%y' .git/index.lock || true
    rm -f .git/index.lock
    exit 0
  elif [ "$rc" -ne 0 ]; then
    echo "::error::pgrep failed with exit code $rc, so this step cannot tell whether .git/index.lock is stale. Re-run the job."
    exit 1
  fi
  [ "$i" -eq 30 ] || sleep 1
done
echo "::error::.git/index.lock still exists after 30 seconds while the git processes listed above run. Check the 'Print Git index lock diagnostics' step for when the lock appeared, then re-run the job."
exit 1
