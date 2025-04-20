#!/usr/bin/env bash

set -eo pipefail

script_dir="$(dirname "$0")"

shopt -s dotglob

# an optional template file will be synced only if the target file is present in the file system,
# and its content contains the string `@generated`.
OPTIONAL_TEMPLATE_FILES=(
  # add a relative file path from `templates/` for each new optional file
  "scripts/with-node.sh"
)

# returns relative file paths inside a given directory without the leading "./".
# usage: get_relative_files "/path/to/dir"
get_relative_files() {
  pushd $1 > /dev/null
  local files=$(find . -type f | cut -c 3-)
  popd > /dev/null
  echo $files
}


copy_file_by_checksum() {
  local source=$1
  local target=$2
  if command -v rsync > /dev/null 2>&1; then
    rsync --checksum "$source" "$target"
  else
    echo "$(basename $0): rsync not found. falling back with md5sum..."
    # Fallback for windows environment without rsync like Git for Windows
    if [[ ! -f "$target" ]]; then
      echo "Copying new file: $target"
      mkdir -p "$(dirname $target)"
      cp "$source" "$target"
    else
      local s_checksum=$(md5sum "$source" | awk '{print $1}')
      local t_checksum=$(md5sum "$target" | awk '{print $1}')
      if [[ "$s_checksum" != "$t_checksum" ]]; then
        echo "Copying different file: $target"
        cp "$source" "$target"
      fi
    fi
  fi
}

# syncs the source file if the target file is missing or the existing file contains `@generated`.
# usage: sync_file_if_missing "/path/source_path" "/path/target_path"
sync_file_if_missing() {
  local source=$1
  local target=$2
  # echo "sync_file_if_missing $source -> $target"
  if [ ! -f "$target" ] || grep --quiet "@generated" "$target"; then
    copy_file_by_checksum "$source" "$target"
  fi
}

# syncs the source file if the target file is present in the file system and its content contains `@generated`.
# usage: sync_file_if_present "/path/source_path" "/path/target_path"
sync_file_if_present() {
  local source=$1
  local target=$2
  # echo "sync_file_if_present $source -> $target"
  if [ -f "$target" ] && grep --quiet "@generated" "$target"; then
    copy_file_by_checksum "$source" "$target"
  fi
}

# check if a file is listed in `OPTIONAL_TEMPLATE_FILES`.
# usage: if is_optional_file "path/to/file"; then ... fi
is_optional_file() {
  local file=$1
  for optional_file in "${OPTIONAL_TEMPLATE_FILES[@]}"; do
    if [ "$file" = "$optional_file" ]; then
      true
      return
    fi
  done

  false
  return
}

#
# script main starts from here
#

"$script_dir/expo-module-readme"

template_files=$(get_relative_files "$script_dir/../templates")
for template_relative_file in $template_files; do
  if is_optional_file "$template_relative_file"; then
    sync_file_if_present "$script_dir/../templates/$template_relative_file" "$template_relative_file"
  else
    sync_file_if_missing "$script_dir/../templates/$template_relative_file" "$template_relative_file"
  fi
done
