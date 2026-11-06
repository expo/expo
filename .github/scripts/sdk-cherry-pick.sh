#!/usr/bin/env bash
# Backports a pull request that merged into main to an sdk-NN release branch.
#
#   sdk-cherry-pick.sh check-target  Tell whether prepare can need expotools.
#   sdk-cherry-pick.sh prepare       Cherry-pick, convert changesets, and record what to publish.
#   sdk-cherry-pick.sh publish       Push the branch, open the pull request, and comment.
#   sdk-cherry-pick.sh run           prepare, then publish. For local use.
#
# prepare and publish are separate commands so that the token that can push is only in the
# environment of publish. prepare reads changesets and other text that a pull request author wrote.
#
# prepare and publish read:
#   PR_NUMBER, SDK_VERSION  Required. The pull request on main, and the NN of sdk-NN.
#   REPO_DIR                Required. A clone of the repository with an `origin` remote. prepare
#                           fetches into it and adds a temporary worktree. No code from it runs.
#   MERGE_SHA, PR_TITLE, PR_AUTHOR
#                           Read with `gh pr view` when one of them is missing.
#   DRY_RUN                 `true` (default) or `false`. A dry run does not push, open a pull
#                           request, or comment.
#   GH_TOKEN                prepare: a read-only token. publish: a token that can push, open pull
#                           requests, and comment.
#   REPO                    Default: $GITHUB_REPOSITORY, or expo/expo.
#   STATE_DIR               Where prepare records the result for publish.
#                           Default: $RUNNER_TEMP or $TMPDIR, then /sdk-cherry-pick-<PR>-<SDK>.
#
# check-target reads the same variables as prepare and writes `tools=true|false` to
# $GITHUB_OUTPUT when it is set.

# shellcheck disable=SC2016 # Backticks in single quotes are Markdown code spans, not commands.
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
expotools="$script_dir/../../tools/bin/expotools.js"

REPO=${REPO:-${GITHUB_REPOSITORY:-expo/expo}}
DRY_RUN=${DRY_RUN:-true}
temp_root=${RUNNER_TEMP:-${TMPDIR:-/tmp}}
temp_root=${temp_root%/}

bot_name='Expo Bot'
bot_email='expo-bot@users.noreply.github.com'
author_pattern='^[A-Za-z0-9-]+$'
changeset_pattern='^\.changeset/[A-Za-z0-9._-]+\.md$'
package_name_pattern='^[@A-Za-z0-9._/-]+$'
# No path segment starts with a dot, so `.` and `..` cannot occur.
changelog_pattern='^(packages|templates)/([A-Za-z0-9@_-][A-Za-z0-9@._-]*/)+CHANGELOG\.md$'
# Keep this rule the same as the one in tools/src/commands/CheckSdkPrsCommand.ts
# (`et check-sdk-prs`): the first match in a commit subject is the pull request.
pr_reference_pattern='\(#([0-9]+)\)'

die() {
  echo "error: $*" >&2
  exit 1
}

# Text from a pull request can hold GitHub Actions workflow commands, such as `::add-mask::`.
# The runner reads no commands while that text prints.
print_untrusted() {
  if [ -z "${GITHUB_ACTIONS:-}" ]; then
    cat
    return
  fi
  local token
  token=$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')
  echo "::stop-commands::$token"
  cat
  echo "::$token::"
}

is_dry_run() {
  [ "$DRY_RUN" = true ]
}

load_common() {
  [[ "${PR_NUMBER:-}" =~ ^[1-9][0-9]*$ ]] || die "PR_NUMBER must be a pull request number, such as 48723."
  [[ "${SDK_VERSION:-}" =~ ^[1-9][0-9]*$ ]] || die "SDK_VERSION must be a number, such as 58."
  [[ "$DRY_RUN" =~ ^(true|false)$ ]] || die "DRY_RUN must be true or false."
  [ -n "${REPO_DIR:-}" ] || die "REPO_DIR must name a clone of $REPO."
  target_branch="sdk-$SDK_VERSION"
  work_branch="bot/sdk-$SDK_VERSION-cherry-pick-$PR_NUMBER"
  state_dir=${STATE_DIR:-$temp_root/sdk-cherry-pick-$PR_NUMBER-$SDK_VERSION}
}

load_pull_request() {
  if [ -z "${MERGE_SHA:-}" ] || [ -z "${PR_TITLE:-}" ] || [ -z "${PR_AUTHOR:-}" ]; then
    local json
    json=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state,baseRefName,mergeCommit,title,author)
    [ "$(jq -r .state <<<"$json")" = MERGED ] || die "#$PR_NUMBER is not merged."
    [ "$(jq -r .baseRefName <<<"$json")" = main ] || die "#$PR_NUMBER did not merge into main."
    MERGE_SHA=$(jq -r .mergeCommit.oid <<<"$json")
    PR_TITLE=$(jq -r .title <<<"$json")
    PR_AUTHOR=$(jq -r .author.login <<<"$json")
  fi
  [[ "$MERGE_SHA" =~ ^[0-9a-f]{40}$ ]] || die "MERGE_SHA \"$MERGE_SHA\" is not a commit SHA."
}

# Hooks and fsmonitor are configuration that could run a program. The target tree is data only.
tgit() {
  git -C "$target_dir" -c core.hooksPath=/dev/null -c core.fsmonitor=false \
    -c user.name="$bot_name" -c user.email="$bot_email" "$@"
}

manual_steps() {
  local uses_changesets=$1
  cat <<EOF
To backport it by hand:

\`\`\`sh
git fetch origin main $target_branch
git checkout -b $work_branch origin/$target_branch
git cherry-pick -x ${MERGE_SHA:-<merge commit of #$PR_NUMBER>}
\`\`\`

EOF
  case "$uses_changesets" in
    no)
      echo "\`$target_branch\` does not use changesets. For each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names. Then delete the changeset file."
      ;;
    unknown)
      echo "If \`$target_branch\` has no \`.changeset/config.json\`, it does not use changesets. Then, for each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the changeset file."
      ;;
  esac
}

finish_with_comment() {
  printf '%s\n' "$1" >"$state_dir/comment.md"
  echo comment >"$state_dir/outcome"
}

finish_without_comment() {
  echo "$1 Nothing to publish."
  echo skip >"$state_dir/outcome"
}

# Text that a pull request author controls reaches a comment only through this. Without
# backticks it cannot end a code span, and without `@` it cannot mention anyone.
comment_text() {
  local text=${1//[\`@]/}
  text=${text//[$'\r\n']/ }
  printf '%s' "${text:0:200}"
}

run_log_link() {
  if [ -n "${GITHUB_RUN_ID:-}" ]; then
    printf ' [Run log](%s/%s/actions/runs/%s)' "${GITHUB_SERVER_URL:-https://github.com}" "$REPO" "$GITHUB_RUN_ID"
  fi
}

cleanup() {
  if [ -n "${target_dir:-}" ] && [ -e "$target_dir" ]; then
    git -C "$REPO_DIR" worktree remove --force "$target_dir" || true
  fi
  if [ -n "${run_dir:-}" ]; then
    rm -rf "$run_dir"
  fi
}

# Prints the errors of a JSON report from expotools as a Markdown list for a comment.
error_list() {
  jq -r '
    (.errors[:10][] | "- `" + (gsub("`"; "") | gsub("[\r\n]"; " ") | .[:300]) + "`"),
    (.errors | length - 10 | select(. > 0) | "- \(.) more. The run log lists every error.")
  ' "$1"
}

# Writes the report of `et list-backport-changesets` to $list_json. When the report is missing or
# malformed, it comments and returns 1. $1 is "no" or "yes": whether the target uses changesets.
list_changesets() {
  local list_status=0
  list_json="$run_dir/changesets.json"
  node "$expotools" list-backport-changesets --repo "$target_dir" --base "$base" \
    --json "$list_json" 2>&1 | print_untrusted || list_status=$?
  # Exit code 1 with a complete report means that the report has errors. Any other failure can
  # leave an empty or partial file. The loops below split the report on NUL characters, so a
  # control character in a value could pair a package with the wrong CHANGELOG.md.
  if [ "$list_status" -gt 1 ] || ! jq -en --argjson status "$list_status" '
    def plain: type == "string" and (test("[\u0000-\u001f\u007f]") | not);
    [inputs] | length == 1 and (.[0] | type == "object"
      and (.ok | type == "boolean")
      and (.errors | type == "array" and all(plain))
      and .ok == (.errors | length == 0)
      and .ok == ($status == 0)
      and (.changesets | type == "array" and all(plain))
      and (.packages | type == "array" and all(
        type == "object" and (.name | plain) and (.changelog == null or (.changelog | plain)))))
  ' "$list_json" >/dev/null 2>&1; then
    finish_with_comment "$(printf 'The bot could not list the changesets of this pull request with `et list-backport-changesets`, so no backport pull request was opened.%s\n\n%s' "$(run_log_link)" "$(manual_steps "$1")")"
    return 1
  fi
}

# A branch with changesets keeps them, but a changeset that names a package the branch does not
# have breaks its release.
check_kept_changesets() {
  list_changesets yes || return 0
  if [ "$(jq '.changesets | length' "$list_json")" -eq 0 ]; then
    conversion=none
  fi
  if [ "$(jq '.errors | length' "$list_json")" -ne 0 ]; then
    finish_with_comment "$(printf 'The changesets of this pull request do not fit `%s`, so no backport pull request was opened:\n\n%s\n\nIn the backport, fix each changeset. For example, remove a package that `%s` does not have.\n\n%s' "$target_branch" "$(error_list "$list_json")" "$target_branch" "$(manual_steps yes)")"
  fi
}

# Adds the entries for `changesets` to the CHANGELOG.md files in the target worktree. When the
# conversion fails, it comments and returns 1.
add_entries() {
  local convert_json="$run_dir/convert.json"
  echo "Converting ${#changesets[@]} changeset(s) with et convert-backport-changesets."
  node "$expotools" convert-backport-changesets --repo "$target_dir" --base "$base" \
    --pr "$PR_NUMBER" --author "$PR_AUTHOR" --json "$convert_json" 2>&1 | print_untrusted || true
  if [ "$(jq -r .ok "$convert_json" 2>/dev/null)" = true ]; then
    return 0
  fi
  if jq -e '.errors | type == "array" and length > 0 and all(type == "string")' \
    "$convert_json" >/dev/null 2>&1; then
    finish_with_comment "$(printf 'The changesets of this pull request do not fit `%s`, so no backport pull request was opened:\n\n%s\n\n%s' "$target_branch" "$(error_list "$convert_json")" "$(manual_steps no)")"
  else
    finish_with_comment "$(printf 'The bot could not convert the changesets of this pull request with `et convert-backport-changesets`, so no backport pull request was opened.%s\n\n%s' "$(run_log_link)" "$(manual_steps no)")"
  fi
  return 1
}

convert_changesets() {
  local changesets=() changelogs=() path mode name changelog

  # The conversion and the check read the changesets and the packages with the same code, so the
  # files that the conversion edits are the files that the check expects.
  list_changesets no || return 0

  while IFS= read -r -d '' path; do
    mode=''
    if [[ "$path" =~ $changeset_pattern ]]; then
      mode=$(tgit ls-tree "$base" -- "$path" | cut -d' ' -f1)
    fi
    if [ "$mode" != 100644 ]; then
      finish_with_comment "$(printf 'The changeset `%s` is not a regular file with a plain name, so the bot did not convert it.\n\n%s' "$(comment_text "$path")" "$(manual_steps no)")"
      return
    fi
    changesets+=("$path")
  done < <(jq -j '.changesets[] | ., "\u0000"' "$list_json")

  while IFS= read -r -d '' name && IFS= read -r -d '' changelog; do
    if ! [[ "$name" =~ $package_name_pattern ]]; then
      finish_with_comment "$(printf 'A changeset names the package `%s`, which is not a valid package name, so the bot did not convert the changesets.\n\n%s' "$(comment_text "$name")" "$(manual_steps no)")"
      return
    fi
    changelogs+=("$changelog")
  done < <(jq -j '.packages[] | .name, "\u0000", (.changelog // ""), "\u0000"' "$list_json")

  if [ "$(jq '.errors | length' "$list_json")" -ne 0 ]; then
    finish_with_comment "$(printf 'The changesets of this pull request do not fit `%s`, so no backport pull request was opened:\n\n%s\n\n%s' "$target_branch" "$(error_list "$list_json")" "$(manual_steps no)")"
    return
  fi

  if [ ${#changesets[@]} -eq 0 ]; then
    conversion=none
    return
  fi

  for path in ${changelogs[@]+"${changelogs[@]}"}; do
    if ! [[ "$path" =~ $changelog_pattern ]] || [ "$(tgit ls-tree "$base" -- "$path" | cut -d' ' -f1)" != 100644 ]; then
      finish_with_comment "$(printf '`%s` is missing or is not a regular file on `%s`, so the bot did not convert the changesets.\n\n%s' "$(comment_text "$path")" "$target_branch" "$(manual_steps no)")"
      return
    fi
  done

  if [ ${#changelogs[@]} -gt 0 ]; then
    add_entries || return 0
  else
    echo "The changesets name no packages, so there are no CHANGELOG.md entries to add. The bot only deletes them."
  fi
  tgit rm --quiet -- "${changesets[@]}"
  tgit add -A

  local gate_json="$run_dir/gate.json"
  node "$expotools" check-backport-changelog --repo "$target_dir" \
    --base "$base" --pr "$PR_NUMBER" --author "$PR_AUTHOR" --json "$gate_json" 2>&1 |
    print_untrusted || true

  local tree=''
  if [ -f "$gate_json" ] && [ "$(jq -r .ok "$gate_json")" = true ]; then
    tree=$(jq -r .tree "$gate_json")
  fi
  if ! [[ "$tree" =~ ^[0-9a-f]{40}$ ]]; then
    local reasons='The check did not write a result.'
    if [ -f "$gate_json" ]; then
      reasons=$(error_list "$gate_json")
    fi
    finish_with_comment "$(printf 'The changesets of this pull request were converted, but `et check-backport-changelog` rejected the result, so no backport pull request was opened.\n\n%s\n\n%s' "$reasons" "$(manual_steps no)")"
    return
  fi

  if [ ${#changelogs[@]} -gt 0 ]; then
    head=$(tgit commit-tree "$tree" -p "$base" \
      -m "Convert changesets to CHANGELOG entries" \
      -m "$target_branch does not use changesets. This commit moves the changesets of #$PR_NUMBER into CHANGELOG.md entries.")
    conversion=converted
  else
    head=$(tgit commit-tree "$tree" -p "$base" \
      -m "Delete changesets" \
      -m "$target_branch does not use changesets. The changesets of #$PR_NUMBER name no packages, so this commit deletes them.")
    conversion=deleted
  fi
}

# Older branches track `build/` in git, and check-packages fails when it does not match the source.
# The bot never runs code from the pull request, so it does not rebuild. It names the command instead.
build_note() {
  local file dir dirs=''
  while IFS= read -r -d '' file; do
    [[ "$file" == */src/* ]] || continue
    [[ "$file" == */__tests__/* || "$file" == */__mocks__/* ]] && continue
    dir=${file%%/src/*}
    if tgit cat-file -e "$base:$dir/build" 2>/dev/null; then
      dirs+="$(comment_text "$dir")"$'\n'
    fi
  done < <(tgit diff-tree -r -z --no-commit-id --name-only "$base")
  if [ -z "$dirs" ]; then
    return
  fi
  printf '\n`%s` tracks `build/` directories in git. This backport changes the source next to these directories:\n\n' "$target_branch"
  while IFS= read -r dir; do
    printf -- '- `%s/build`\n' "$dir"
  done < <(sort -u <<<"${dirs%$'\n'}")
  printf '\ncheck-packages fails if the build output changes. In a checkout of this branch, run `et check-packages --since origin/%s`, then commit and push the changed `build/` files.\n' "$target_branch"
}

# Prints "<sha> <subject>" for each commit on the target branch that main does not have, that is,
# each commit since the branch cut. The checkout has only the tip of main, and a shallow git fetch
# of that range fails on GitHub when the range is empty, so the compare API lists the commits.
# Bash clears `set -e` in a command substitution, so the gh call must stay the last command.
commits_since_cut() {
  gh api --paginate "repos/$REPO/compare/main...$target_branch?per_page=100" \
    --jq '.commits[] | "\(.sha) \(.commit.message | split("\n")[0])"'
}

prepare() {
  load_common
  rm -rf "$state_dir"
  mkdir -p "$state_dir"
  load_pull_request
  : >"$state_dir/pull-request-loaded"
  # The squash merge appends ` (#<backport>)`, so the first `(#N)` of the subject names this pull
  # request. `et check-sdk-prs` reads that number, so a `(#N)` in the title loses its parentheses.
  # The loop repeats until none is left: `((#N))` becomes `(#N)` after one pass.
  local title
  title=$(sed -E -e ':a' -e 's/\(#([0-9]+)\)/#\1/' -e 'ta' <<<"$PR_TITLE")
  printf '%s\n' "[$target_branch] $title (#$PR_NUMBER)" >"$state_dir/title"

  # A failed `ls-remote` inside `[ ]` would read as a missing branch. An assignment stops on it.
  local target_heads
  target_heads=$(git -C "$REPO_DIR" ls-remote --heads origin "refs/heads/$target_branch")
  # An `sdk-NN` label can name an SDK that a change affects, or a release that has no branch yet.
  if [ -z "$target_heads" ]; then
    finish_without_comment "The $target_branch branch does not exist, so no backport was made."
    return
  fi

  # A pull request that merged into main before the branch cut is already on the target branch,
  # and a label added later must not backport it again. The clone is shallow, so the compare API
  # tells whether the target branch contains the merge commit.
  local ancestry
  ancestry=$(gh api "repos/$REPO/compare/$target_branch...$MERGE_SHA?per_page=1" --jq .status)
  if [ "$ancestry" = behind ] || [ "$ancestry" = identical ]; then
    finish_without_comment "#$PR_NUMBER is already on $target_branch: $target_branch contains $MERGE_SHA."
    return
  fi

  local since_cut sha subject
  since_cut=$(commits_since_cut)
  while read -r sha subject; do
    if [[ "$subject" =~ $pr_reference_pattern ]] && [ "${BASH_REMATCH[1]}" = "$PR_NUMBER" ]; then
      finish_without_comment "#$PR_NUMBER is already on $target_branch: the subject of $sha names it first."
      return
    fi
  done <<<"$since_cut"

  # The changelog trailer links the author, and the check accepts only the login of a GitHub user.
  if ! [[ "$PR_AUTHOR" =~ $author_pattern ]]; then
    finish_with_comment "This pull request has the \`$target_branch\` label, but a bot or an app authored it, so no backport was made. Backport it to \`$target_branch\` by hand."
    return
  fi

  # `gh pr list --head` matches the branch name in any repository, so a fork can use the same name.
  local backports merged_pr open_pr closed_pr work_heads branch_exists=false
  backports=$(gh pr list --repo "$REPO" --head "$work_branch" --base "$target_branch" --state all \
    --json url,state,headRepository,headRepositoryOwner |
    jq -c --arg repo "$REPO" '[.[] | select("\(.headRepositoryOwner.login)/\(.headRepository.name)" == $repo)]')
  merged_pr=$(jq -r 'map(select(.state == "MERGED"))[0].url // empty' <<<"$backports")
  open_pr=$(jq -r 'map(select(.state == "OPEN"))[0].url // empty' <<<"$backports")
  closed_pr=$(jq -r 'map(select(.state == "CLOSED"))[0].url // empty' <<<"$backports")
  work_heads=$(git -C "$REPO_DIR" ls-remote --heads origin "refs/heads/$work_branch")
  if [ -n "$work_heads" ]; then
    branch_exists=true
  fi
  if [ -n "$merged_pr" ]; then
    finish_without_comment "The backport $merged_pr already merged."
    return
  fi
  if [ -n "$open_pr" ]; then
    finish_without_comment "The backport $open_pr is already open."
    return
  fi

  # Someone closed the backport on purpose. Without the branch, the bot makes a new backport.
  if [ -n "$closed_pr" ] && [ "$branch_exists" = true ]; then
    finish_with_comment "The backport $closed_pr was closed without merging, so no new backport was made. Reopen it, or delete the \`$work_branch\` branch so that the bot can make a new backport."
    return
  fi

  # A person can open a backport from any branch. Its title names this pull request as `(#N)`.
  local manual_pr
  manual_pr=$(gh pr list --repo "$REPO" --base "$target_branch" --state open \
    --search "$PR_NUMBER in:title" --limit 100 --json number,title |
    jq -r --arg reference "(#$PR_NUMBER)" 'map(select(.title | contains($reference)))[0].number // empty')
  if [ -n "$manual_pr" ]; then
    finish_with_comment "A backport into \`$target_branch\` is already open in #$manual_pr, so no second backport was made."
    return
  fi

  # An earlier run pushed the branch, then failed to open the pull request.
  if [ "$branch_exists" = true ]; then
    cat >"$state_dir/body.md" <<EOF
Backport of #$PR_NUMBER to \`$target_branch\`. An earlier run of the bot pushed \`$work_branch\` but did not open a pull request for it, so this run opened one from the branch as it is. Review the branch before you merge.
EOF
    echo open-pr-from-branch >"$state_dir/outcome"
    return
  fi

  local depth=''
  if [ "$(git -C "$REPO_DIR" rev-parse --is-shallow-repository)" = true ]; then
    depth=--depth=2
  fi
  git -C "$REPO_DIR" fetch --quiet --no-tags ${depth:+"$depth"} origin "$MERGE_SHA" \
    "+refs/heads/$target_branch:refs/remotes/origin/$target_branch"

  local target_tip uses_changesets=no parents
  target_tip=$(git -C "$REPO_DIR" rev-parse --verify "refs/remotes/origin/$target_branch^{commit}")
  if git -C "$REPO_DIR" cat-file -e "$target_tip:.changeset/config.json" 2>/dev/null; then
    uses_changesets=yes
  fi
  parents=$(git -C "$REPO_DIR" rev-list --parents -n 1 "$MERGE_SHA" | wc -w)
  if [ "$parents" -ne 2 ]; then
    finish_with_comment "$(printf 'The merge commit %s does not have exactly one parent, so the bot cannot cherry-pick it.\n\n%s' "$MERGE_SHA" "$(manual_steps "$uses_changesets")")"
    return
  fi

  run_dir=$(mktemp -d "$temp_root/sdk-cherry-pick.XXXXXX")
  target_dir="$run_dir/target"
  trap cleanup EXIT
  git -C "$REPO_DIR" worktree add --quiet --detach "$target_dir" "$target_tip"

  if ! tgit cherry-pick -x "$MERGE_SHA" >"$run_dir/cherry-pick.log" 2>&1; then
    print_untrusted <"$run_dir/cherry-pick.log"
    local conflicts='' empty=false
    if tgit rev-parse --quiet --verify CHERRY_PICK_HEAD >/dev/null; then
      # A backtick in a file name would end the code block of the comment.
      conflicts=$(tgit diff --name-only --diff-filter=U | tr -d '`')
      if [ -z "$conflicts" ] && tgit diff --cached --quiet HEAD; then
        empty=true
      fi
      tgit cherry-pick --abort
    fi
    if [ -n "$conflicts" ]; then
      local conflict_count
      conflict_count=$(wc -l <<<"$conflicts" | tr -d ' ')
      if [ "$conflict_count" -gt 50 ]; then
        conflicts=$(printf '%s\n%s more. The run log lists every file.' "$(head -n 50 <<<"$conflicts")" "$((conflict_count - 50))")
      fi
      finish_with_comment "$(printf 'The cherry-pick of %s onto `%s` has conflicts, so no backport pull request was opened.%s These files conflict:\n\n```\n%s\n```\n\n%s' "$MERGE_SHA" "$target_branch" "$(run_log_link)" "$conflicts" "$(manual_steps "$uses_changesets")")"
    elif [ "$empty" = true ]; then
      finish_with_comment "This change is already on \`$target_branch\`: the cherry-pick of $MERGE_SHA is empty. No backport was made."
    else
      finish_with_comment "$(printf 'The cherry-pick of %s onto `%s` failed, so no backport pull request was opened.%s\n\n%s' "$MERGE_SHA" "$target_branch" "$(run_log_link)" "$(manual_steps "$uses_changesets")")"
    fi
    return
  fi

  base=$(tgit rev-parse HEAD)
  head=$base
  conversion=kept
  if [ "$uses_changesets" = no ]; then
    convert_changesets
  else
    check_kept_changesets
  fi
  if [ -f "$state_dir/outcome" ]; then
    return
  fi

  local conversion_note
  case "$conversion" in
    kept) conversion_note="\`$target_branch\` uses changesets, so the changesets of #$PR_NUMBER are kept as they are. \`et list-backport-changesets\` found each package that they name on \`$target_branch\`." ;;
    none) conversion_note="#$PR_NUMBER adds no changesets." ;;
    converted) conversion_note="\`$target_branch\` does not use changesets. The bot moved the changesets of #$PR_NUMBER into \`CHANGELOG.md\` entries. It put each entry in a section by the bump type: \`patch\` and \`none\` under \`### 💡 Others\`, and \`minor\` under \`### 🎉 New features\`. \`et check-backport-changelog\` checked the result. That change is in its own commit. Before you merge, check that each entry is in the right section." ;;
    deleted) conversion_note="\`$target_branch\` does not use changesets. The changesets of #$PR_NUMBER name no packages, so the bot deleted them, and \`et check-backport-changelog\` checked the result. That change is in its own commit." ;;
  esac
  cat >"$state_dir/body.md" <<EOF
Backport of #$PR_NUMBER to \`$target_branch\`. The bot cherry-picked $MERGE_SHA with \`git cherry-pick -x\`.

$conversion_note
$(build_note)
EOF
  printf '%s\n' "$target_tip" >"$state_dir/target-tip"
  printf '%s\n' "$head" >"$state_dir/commit"
  echo open-pr >"$state_dir/outcome"
}

# Each run comments at most once. A failed `gh pr comment` can still have posted.
comment_on_original() {
  commented=true
  if is_dry_run; then
    echo "Comment on #$PR_NUMBER:"
    printf '%s\n' "$1" | print_untrusted
  else
    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "$1"
  fi
}

# With `push`, pushes the prepared commit first. Without it, the branch already exists.
open_backport() {
  local push=${1:-} commit='' title target_tip=''
  title=$(cat "$state_dir/title")
  if [ "$push" = push ]; then
    commit=$(cat "$state_dir/commit")
    target_tip=$(cat "$state_dir/target-tip")
  fi

  if is_dry_run; then
    {
      if [ "$push" = push ]; then
        echo "Branch: $work_branch"
        echo "Commits:"
        git -C "$REPO_DIR" log --oneline "$target_tip..$commit"
        echo "Diff summary:"
        git -C "$REPO_DIR" diff --stat "$target_tip" "$commit"
      else
        echo "Branch: $work_branch, which exists already. It is not pushed again."
      fi
      echo "Pull request into $target_branch:"
      echo "  Title: $title"
      echo "  Body:"
      sed 's/^/    /' "$state_dir/body.md"
    } | print_untrusted
    comment_on_original "The backport to \`$target_branch\` is open: <pull request URL>"
    return
  fi

  if [ "$push" = push ]; then
    # The token stays in the environment. It is not in .git/config or on a command line: git
    # expands $GH_TOKEN in the shell that runs the helper.
    git -C "$REPO_DIR" -c credential.helper= \
      -c credential.helper='!f() { echo username=x-access-token; echo "password=$GH_TOKEN"; }; f' \
      push --quiet "https://github.com/$REPO.git" "$commit:refs/heads/$work_branch"
  fi
  branch_on_remote=true
  local url
  url=$(gh pr create --repo "$REPO" --base "$target_branch" --head "$work_branch" \
    --title "$title" --body-file "$state_dir/body.md")
  comment_on_original "The backport to \`$target_branch\` is open: $url"
}

# Under `set -e`, a failed push or `gh pr create` ends publish. This trap still tells the author.
# A manual run can name any pull request, so the trap comments only when prepare read it as merged
# into main, or when MERGE_SHA came from the event of a pull request that merged into main.
on_publish_exit() {
  local status=$1
  if [ "$status" -ne 0 ] && [ "$commented" = false ] &&
    { [ -f "$state_dir/pull-request-loaded" ] || [ -n "${MERGE_SHA:-}" ]; }; then
    if [ "$branch_on_remote" = true ]; then
      comment_on_original "$(printf 'The `%s` branch is on GitHub, but the bot could not open the backport pull request into `%s`.%s Re-run the failed jobs of the workflow run. The new run opens the pull request from that branch.' "$work_branch" "$target_branch" "$(run_log_link)")" || true
    else
      comment_on_original "$(printf 'The backport to `%s` failed before it could finish, so no backport pull request was opened.%s\n\n%s' "$target_branch" "$(run_log_link)" "$(manual_steps unknown)")" || true
    fi
  fi
  cleanup
}

publish() {
  load_common
  commented=false
  branch_on_remote=false
  trap 'on_publish_exit $?' EXIT
  if is_dry_run; then
    echo "Dry run: nothing is pushed, opened, or commented."
  fi
  case "$(cat "$state_dir/outcome" 2>/dev/null || true)" in
    open-pr) open_backport push ;;
    open-pr-from-branch)
      branch_on_remote=true
      open_backport
      ;;
    comment) comment_on_original "$(cat "$state_dir/comment.md")" ;;
    skip) echo "Nothing to publish. The prepare step says why." ;;
    *)
      echo "error: prepare did not record an outcome." >&2
      exit 1
      ;;
  esac
}

# Tells the workflow whether to install expotools. prepare needs expotools when the target branch
# exists. prepare checks the branch again. If it then needs expotools and they are not installed, it
# fails, and publish comments on the pull request.
check_target() {
  load_common
  local heads tools=true
  heads=$(git -C "$REPO_DIR" ls-remote --heads origin "refs/heads/$target_branch")
  if [ -z "$heads" ]; then
    echo "$target_branch does not exist."
    tools=false
  fi
  printf 'tools=%s\n' "$tools"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'tools=%s\n' "$tools" >>"$GITHUB_OUTPUT"
  fi
}

case "${1:-}" in
  check-target) check_target ;;
  prepare) prepare ;;
  publish) publish ;;
  run)
    prepare
    publish
    ;;
  *)
    echo "Usage: $0 check-target | prepare | publish | run" >&2
    exit 2
    ;;
esac
