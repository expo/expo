#!/usr/bin/env bash
# Backports a pull request that merged into main to an sdk-NN release branch.
#
#   sdk-cherry-pick.sh prepare             Cherry-pick, convert changesets, and record what to publish.
#   sdk-cherry-pick.sh publish             Push the branch, open the pull request, and comment.
#   sdk-cherry-pick.sh run                 prepare, then publish. For local use.
#   sdk-cherry-pick.sh mark-cherry-picked  Label the original pull request after its backport merges.
#
# prepare and publish are separate commands so that the token that can push is only in the
# environment of publish. prepare runs the model, and the model reads text that a pull request
# author wrote.
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
#   MODEL                   The model that converts changesets. Default: claude-opus-5-5.
#   REPO                    Default: $GITHUB_REPOSITORY, or expo/expo.
#   STATE_DIR               Where prepare records the result for publish.
#                           Default: $RUNNER_TEMP or $TMPDIR, then /sdk-cherry-pick-<PR>-<SDK>.
#
# mark-cherry-picked reads BASE_REF, HEAD_REF, HEAD_REPO, GH_TOKEN, DRY_RUN, and REPO.

# shellcheck disable=SC2016 # Backticks in single quotes are Markdown code spans, not commands.
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
expotools="$script_dir/../../tools/bin/expotools.js"
prompt_file="$script_dir/sdk-cherry-pick-changelog-prompt.md"

REPO=${REPO:-${GITHUB_REPOSITORY:-expo/expo}}
DRY_RUN=${DRY_RUN:-true}
MODEL=${MODEL:-claude-opus-5-5}
temp_root=${RUNNER_TEMP:-${TMPDIR:-/tmp}}
temp_root=${temp_root%/}

bot_name='Expo Bot'
bot_email='expo-bot@users.noreply.github.com'
author_pattern='^[A-Za-z0-9-]+$'
changeset_pattern='^\.changeset/[A-Za-z0-9._-]+\.md$'
package_name_pattern='^[@A-Za-z0-9._/-]+$'

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
      echo
      ;;
    unknown)
      echo "If \`$target_branch\` has no \`.changeset/config.json\`, it does not use changesets. Then, for each \`.changeset/*.md\` file that this pull request adds, add its summary as an entry under \`## Unpublished\` in the \`CHANGELOG.md\` of each package that it names, and delete the changeset file."
      echo
      ;;
  esac
  echo "With this branch name, the \`SDK $SDK_VERSION cherry-picked\` label is added to this pull request when the backport merges."
}

finish_with_comment() {
  printf '%s\n' "$1" >"$state_dir/comment.md"
  echo comment >"$state_dir/outcome"
}

finish_without_comment() {
  echo "$1 Nothing to publish."
  echo skip >"$state_dir/outcome"
}

# Text that a model or a pull request author controls reaches a comment only through this. Without
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

# Prints "<name><TAB><dir>" for each package on the target branch.
list_packages() {
  local file name
  tgit ls-files -z -- ':(glob)packages/*/package.json' ':(glob)packages/@*/*/package.json' \
    ':(glob)templates/*/package.json' |
    while IFS= read -r -d '' file; do
      name=$(tgit cat-file blob "$base:$file" | jq -r '.name // empty' 2>/dev/null) || continue
      if [ -n "$name" ]; then
        printf '%s\t%s\n' "$name" "${file%/package.json}"
      fi
    done
}

# Prints the package names in the front matter of the changeset on stdin.
changeset_packages() {
  awk 'NR == 1 { if ($0 != "---") exit; next } $0 == "---" { exit } { print }' |
    sed -nE "s/^[[:space:]]*[\"']?([^\"':[:space:]]+)[\"']?[[:space:]]*:.*/\1/p"
}

run_model() {
  local claude_bin model=$MODEL home="$run_dir/home"
  claude_bin=$(command -v claude) || die "The claude CLI is not on PATH."
  mkdir -p "$home"
  (
    cd "$model_dir" || exit 1
    # The model reads text that a pull request author wrote. Its environment keeps only PATH,
    # TMPDIR, and its own credential, so it never gets a GitHub token or another secret.
    for name in $(compgen -e); do
      case "$name" in
        PATH | TMPDIR | ANTHROPIC_API_KEY | ANTHROPIC_AUTH_TOKEN | CLAUDE_CODE_OAUTH_TOKEN) ;;
        *) unset "$name" 2>/dev/null || true ;;
      esac
    done
    export HOME="$home" CLAUDE_CONFIG_DIR="$home/.claude"
    if command -v timeout >/dev/null; then
      set -- timeout 900
    fi
    # --restricted keeps Read and Edit inside this directory. --permission-prompts none denies
    # anything that would ask for permission.
    "$@" "$claude_bin" -p \
      --model "$model" \
      --safe-mode \
      --restricted \
      --strict-mcp-config \
      --tools Read,Edit \
      --permission-mode acceptEdits \
      --permission-prompts none \
      --disable-slash-commands \
      --no-session-persistence \
      <"$run_dir/prompt.md"
  )
}

convert_changesets() {
  local changesets=() meta path mode name dir dirs changelog changelogs=()
  local package_list="$run_dir/packages.tsv" names="$run_dir/names.txt"

  while IFS= read -r -d '' meta && IFS= read -r -d '' path; do
    if ! [[ "$path" =~ ^\.changeset/[^/]+\.md$ ]] || [ "$path" = .changeset/README.md ]; then
      continue
    fi
    mode=$(cut -d' ' -f2 <<<"$meta")
    if [ "$mode" != 100644 ] || ! [[ "$path" =~ $changeset_pattern ]]; then
      finish_with_comment "$(printf 'The changeset `%s` is not a regular file with a plain name, so the bot did not convert it.\n\n%s' "$(comment_text "$path")" "$(manual_steps no)")"
      return
    fi
    changesets+=("$path")
  done < <(tgit diff-tree -r -z --raw --no-renames --diff-filter=A "$base^" "$base" -- .changeset)

  if [ ${#changesets[@]} -eq 0 ]; then
    conversion=none
    return
  fi

  model_dir="$run_dir/model"
  mkdir -p "$model_dir/.changeset"
  : >"$names"
  for path in "${changesets[@]}"; do
    tgit cat-file blob "$base:$path" >"$model_dir/$path"
    changeset_packages <"$model_dir/$path" >>"$names"
  done

  list_packages >"$package_list"
  while IFS= read -r name; do
    dirs=$(awk -F '\t' -v name="$name" '$1 == name { print $2 }' "$package_list")
    if ! [[ "$name" =~ $package_name_pattern ]] || [ -z "$dirs" ] || [ "$(wc -l <<<"$dirs")" -ne 1 ]; then
      finish_with_comment "$(printf 'A changeset names the package `%s`, but `%s` has no single package with that name, so the bot did not convert the changesets.\n\n%s' "$(comment_text "$name")" "$target_branch" "$(manual_steps no)")"
      return
    fi
    dir=$dirs
    changelog="$dir/CHANGELOG.md"
    if [ "$(tgit ls-tree "$base" -- "$changelog" | cut -d' ' -f1)" != 100644 ]; then
      finish_with_comment "$(printf '`%s` is missing or is not a regular file on `%s`, so the bot did not convert the changesets.\n\n%s' "$changelog" "$target_branch" "$(manual_steps no)")"
      return
    fi
    mkdir -p "$model_dir/$dir"
    tgit cat-file blob "$base:$changelog" >"$model_dir/$changelog"
    changelogs+=("$name"$'\t'"$changelog")
  done < <(sort -u "$names")

  {
    cat "$prompt_file"
    printf '\n## This run\n\n'
    printf -- '- Pull request: %s\n' "$PR_NUMBER"
    printf -- '- Author: %s\n' "$PR_AUTHOR"
    printf -- '- Trailer: `([#%s](https://github.com/expo/expo/pull/%s) by [@%s](https://github.com/%s))`\n' \
      "$PR_NUMBER" "$PR_NUMBER" "$PR_AUTHOR" "$PR_AUTHOR"
    printf '\nChangesets:\n\n'
    printf -- '- `%s`\n' "${changesets[@]}"
    printf '\n`CHANGELOG.md` files, by package:\n\n'
    for changelog in "${changelogs[@]}"; do
      printf -- '- `%s`: `%s`\n' "${changelog%%$'\t'*}" "${changelog#*$'\t'}"
    done
  } >"$run_dir/prompt.md"

  echo "Converting ${#changesets[@]} changeset(s) with $MODEL."
  local model_status=0
  run_model >"$run_dir/model.log" 2>&1 || model_status=$?
  print_untrusted <"$run_dir/model.log"
  if [ "$model_status" -ne 0 ]; then
    finish_with_comment "$(printf 'The model that converts changesets into `CHANGELOG.md` entries failed (exit code %s), so no backport pull request was opened.\n\n%s' "$model_status" "$(manual_steps no)")"
    return
  fi

  for changelog in "${changelogs[@]}"; do
    path=${changelog#*$'\t'}
    if [ ! -f "$model_dir/$path" ] || [ -L "$model_dir/$path" ]; then
      finish_with_comment "$(printf 'The model did not leave `%s` as a regular file, so no backport pull request was opened.\n\n%s' "$path" "$(manual_steps no)")"
      return
    fi
    cat "$model_dir/$path" >"$target_dir/$path"
  done
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
      reasons=$(jq -r '
        (.errors[:10][] | "- `" + (gsub("`"; "") | gsub("[\r\n]"; " ") | .[:300]) + "`"),
        (.errors | length - 10 | select(. > 0) | "- \(.) more. The run log lists every error.")
      ' "$gate_json")
    fi
    finish_with_comment "$(printf 'The changesets of this pull request were converted into `CHANGELOG.md` entries, but `et check-backport-changelog` rejected the result, so no backport pull request was opened.\n\n%s\n\n%s' "$reasons" "$(manual_steps no)")"
    return
  fi

  head=$(tgit commit-tree "$tree" -p "$base" \
    -m "Convert changesets to CHANGELOG entries" \
    -m "$target_branch does not use changesets. This commit moves the changesets of #$PR_NUMBER into CHANGELOG.md entries.")
  conversion=converted
}

prepare() {
  load_common
  rm -rf "$state_dir"
  mkdir -p "$state_dir"
  load_pull_request
  printf '%s\n' "[$target_branch] Backport #$PR_NUMBER: $PR_TITLE" >"$state_dir/title"

  if [ -z "$(git -C "$REPO_DIR" ls-remote --heads origin "refs/heads/$target_branch")" ]; then
    finish_with_comment "This pull request has the \`SDK $SDK_VERSION\` label, but the \`$target_branch\` branch does not exist, so no backport was made."
    return
  fi

  # The labels of the event are a snapshot from when the workflow started.
  local label="SDK $SDK_VERSION cherry-picked" labels
  labels=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json labels --jq '.labels[].name')
  if grep -Fxq "$label" <<<"$labels"; then
    finish_without_comment "#$PR_NUMBER already has the \"$label\" label."
    return
  fi

  # The changelog trailer links the author, and the check accepts only the login of a GitHub user.
  if ! [[ "$PR_AUTHOR" =~ $author_pattern ]]; then
    finish_with_comment "This pull request has the \`SDK $SDK_VERSION\` label, but a bot or an app authored it, so no backport was made. Backport it to \`$target_branch\` by hand."
    return
  fi

  # `gh pr list --head` matches the branch name in any repository, so a fork can use the same name.
  local backports merged_pr open_pr closed_pr branch_exists=false
  backports=$(gh pr list --repo "$REPO" --head "$work_branch" --base "$target_branch" --state all \
    --json url,state,headRepository,headRepositoryOwner |
    jq -c --arg repo "$REPO" '[.[] | select("\(.headRepositoryOwner.login)/\(.headRepository.name)" == $repo)]')
  merged_pr=$(jq -r 'map(select(.state == "MERGED"))[0].url // empty' <<<"$backports")
  open_pr=$(jq -r 'map(select(.state == "OPEN"))[0].url // empty' <<<"$backports")
  closed_pr=$(jq -r 'map(select(.state == "CLOSED"))[0].url // empty' <<<"$backports")
  if [ -n "$(git -C "$REPO_DIR" ls-remote --heads origin "refs/heads/$work_branch")" ]; then
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
    if [ -f "$state_dir/outcome" ]; then
      return
    fi
  fi

  local conversion_note
  case "$conversion" in
    kept) conversion_note="\`$target_branch\` uses changesets, so the changesets of #$PR_NUMBER are kept as they are." ;;
    none) conversion_note="#$PR_NUMBER adds no changesets, so there was nothing to convert." ;;
    converted) conversion_note="\`$target_branch\` does not use changesets. Claude moved the changesets of #$PR_NUMBER into \`CHANGELOG.md\` entries, and \`et check-backport-changelog\` checked the result. That change is in its own commit. Review the entries before you merge." ;;
  esac
  cat >"$state_dir/body.md" <<EOF
Backport of #$PR_NUMBER to \`$target_branch\`. The bot cherry-picked $MERGE_SHA with \`git cherry-pick -x\`.

$conversion_note
EOF
  printf '%s\n' "$target_tip" >"$state_dir/target-tip"
  printf '%s\n' "$head" >"$state_dir/commit"
  echo open-pr >"$state_dir/outcome"
}

comment_on_original() {
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
  local url
  url=$(gh pr create --repo "$REPO" --base "$target_branch" --head "$work_branch" \
    --title "$title" --body-file "$state_dir/body.md")
  comment_on_original "The backport to \`$target_branch\` is open: $url"
}

publish() {
  load_common
  if is_dry_run; then
    echo "Dry run: nothing is pushed, opened, or commented."
  fi
  case "$(cat "$state_dir/outcome" 2>/dev/null || true)" in
    open-pr) open_backport push ;;
    open-pr-from-branch) open_backport ;;
    comment) comment_on_original "$(cat "$state_dir/comment.md")" ;;
    skip) echo "Nothing to publish. The prepare step says why." ;;
    *)
      comment_on_original "$(printf 'The backport to `%s` failed before it could finish, so no backport pull request was opened.%s\n\n%s' "$target_branch" "$(run_log_link)" "$(manual_steps unknown)")"
      exit 1
      ;;
  esac
}

mark_cherry_picked() {
  [[ "$DRY_RUN" =~ ^(true|false)$ ]] || die "DRY_RUN must be true or false."
  [ "${HEAD_REPO:-}" = "$REPO" ] || die "The head branch is in \"${HEAD_REPO:-}\", not in $REPO."
  [[ "${BASE_REF:-}" =~ ^sdk-([1-9][0-9]*)$ ]] || die "BASE_REF \"${BASE_REF:-}\" is not an sdk-NN branch."
  local sdk=${BASH_REMATCH[1]}
  if ! [[ "${HEAD_REF:-}" =~ ^bot/sdk-([1-9][0-9]*)-cherry-pick-([1-9][0-9]*)$ ]] || [ "${BASH_REMATCH[1]}" != "$sdk" ]; then
    echo "${HEAD_REF:-} is not a backport branch for $BASE_REF. Nothing to label."
    return
  fi
  local pr=${BASH_REMATCH[2]} label="SDK $sdk cherry-picked"
  if is_dry_run; then
    echo "Dry run: add the label \"$label\" to #$pr."
    return
  fi
  gh api --method POST "repos/$REPO/issues/$pr/labels" -f "labels[]=$label" --silent
}

case "${1:-}" in
  prepare) prepare ;;
  publish) publish ;;
  run)
    prepare
    publish
    ;;
  mark-cherry-picked) mark_cherry_picked ;;
  *)
    echo "Usage: $0 prepare | publish | run | mark-cherry-picked" >&2
    exit 2
    ;;
esac
