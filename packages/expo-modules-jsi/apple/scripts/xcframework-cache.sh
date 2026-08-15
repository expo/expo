#!/bin/bash

# Helpers for restoring and storing built ExpoModulesJSI xcframework slices in
# a cache outside the npm package. The caller supplies a content hash that
# includes the source, React Native headers, and Swift toolchain version.

restore_xcframework_slice_cache() {
  local cache_dir="$1"
  local build_hash="$2"
  local slice_id="$3"
  local xcframework_path="$4"

  local cached_slice="${cache_dir}/${build_hash}/${slice_id}.tar.gz"
  if [[ ! -f "$cached_slice" ]]; then
    return 1
  fi

  local slice_dir="${xcframework_path}/${slice_id}"
  local staging_dir="${xcframework_path}/.${slice_id}.cache.$$"
  rm -rf "$staging_dir"
  mkdir -p "$staging_dir"
  tar -xzf "$cached_slice" -C "$staging_dir"

  local staged_slice="${staging_dir}/${slice_id}"
  local staged_hash_file="${staged_slice}/.build-hash"
  if [[ ! -f "$staged_hash_file" ]] || [[ "$(cat "$staged_hash_file")" != "$build_hash" ]]; then
    rm -rf "$staging_dir"
    return 1
  fi

  rm -rf "$slice_dir"
  mv "$staged_slice" "$slice_dir"
  rmdir "$staging_dir"
  # Mark this entry as used so the outer CI cache can evict inactive entries.
  touch "$cached_slice"
}

store_xcframework_slice_cache() {
  local cache_dir="$1"
  local build_hash="$2"
  local slice_id="$3"
  local xcframework_path="$4"

  local slice_dir="${xcframework_path}/${slice_id}"
  local slice_hash_file="${slice_dir}/.build-hash"
  if [[ ! -f "$slice_hash_file" ]] || [[ "$(cat "$slice_hash_file")" != "$build_hash" ]]; then
    return 1
  fi

  local hash_dir="${cache_dir}/${build_hash}"
  local cached_slice="${hash_dir}/${slice_id}.tar.gz"
  local lock_dir="${hash_dir}/.${slice_id}.lock"
  mkdir -p "$hash_dir"

  # Another build can use the same shared cache directory. The first complete
  # writer wins. Readers never see the temporary directory or a partial slice.
  if ! mkdir "$lock_dir" 2>/dev/null; then
    return 0
  fi

  local staging_archive="${hash_dir}/.${slice_id}.cache.$$.tar.gz"
  rm -f "$staging_archive"
  if ! tar -czf "$staging_archive" -C "$xcframework_path" "$slice_id"; then
    rm -f "$staging_archive"
    rmdir "$lock_dir"
    return 1
  fi
  mv -f "$staging_archive" "$cached_slice"
  rmdir "$lock_dir"
}
