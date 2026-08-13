#!/usr/bin/env bash
# Point a new branch on a fork at a commit GitHub already has (the parent
# network). Does not merge-upstream and does not send a pack.
#
# merge-upstream (and `git push` of a SHA that is  N workflow-changing
# commits ahead of the fork's default branch) needs the `workflow` scope.
# Creating a ref at that SHA, then pushing one commit that does not touch
# .github/workflows/**, does not.
set -euo pipefail

if [ "${1:-}" = --self-test ]; then
  tmp=$(mktemp)
  trap 'rm -f "$tmp"' EXIT
  # Valid sha / branch are accepted by the arg checks; we cannot hit the API
  # here. Invalid inputs must die before any gh call.
  if "$0" 2>"$tmp"; then echo "expected usage error"; exit 1; fi
  grep -q usage "$tmp"
  if "$0" owner/repo 'bad branch' "$(printf 'a%.0s' {1..40})" 2>"$tmp"; then
    echo "expected bad branch error"; exit 1
  fi
  grep -q 'odd branch name' "$tmp"
  if "$0" owner/repo ok-branch notasha 2>"$tmp"; then
    echo "expected bad sha error"; exit 1
  fi
  grep -q '40-hex' "$tmp"
  echo "ensure-fork-branch self-test ok"
  exit 0
fi

fork=${1:-}
branch=${2:-}
sha=${3:-}
if [ -z "$fork" ] || [ -z "$branch" ] || [ -z "$sha" ]; then
  echo "usage: ensure-fork-branch.sh <owner/repo> <branch> <sha>" >&2
  exit 2
fi
if ! [[ "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "sha must be a 40-hex commit: $sha" >&2
  exit 2
fi
if ! [[ "$branch" =~ ^[A-Za-z0-9._/-]+$ ]]; then
  echo "refusing odd branch name: $branch" >&2
  exit 2
fi

# The SHA must already live in the fork's object store (shared with the
# parent). If it does not, a later git push would send the whole gap —
# including workflow files — and a public_repo PAT would be refused.
if ! gh api "repos/$fork/git/commits/$sha" --jq .sha >/dev/null; then
  echo "::error::$sha is not in $fork's object store; cannot create a branch without sending a pack."
  exit 1
fi

existing=$(gh api "repos/$fork/git/ref/heads/$branch" --jq .object.sha 2>/dev/null || true)
if [ "$existing" = "$sha" ]; then
  echo "fork branch $branch already at $sha"
  exit 0
fi
if [ -n "$existing" ]; then
  echo "::error::$fork already has $branch at $existing; not moving it."
  exit 1
fi

if ! out=$(gh api -X POST "repos/$fork/git/refs" -f ref="refs/heads/$branch" -f sha="$sha" 2>&1); then
  echo "::error::Could not create refs/heads/$branch on $fork at $sha."
  printf '%s\n' "$out"
  exit 1
fi
echo "created $fork $branch at $sha"
