#!/bin/bash
set -eu
case "$PLATFORM_NAME" in iphoneos|iphonesimulator) ;; *) exit 0 ;; esac

mkdir -p "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH" "$TARGET_TEMP_DIR"
manifest="$TARGET_TEMP_DIR/expo-embedding-frameworks.txt"
next="$manifest.next"
: > "$next"
for src in "$@"; do
  name="$(basename "$src")"
  dst="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$name"
  /usr/bin/rsync -a --delete --exclude Headers --exclude Modules "$src/" "$dst/"
  if [ "${CODE_SIGNING_ALLOWED:-NO}" = YES ]; then
    /usr/bin/codesign --force --sign "${EXPANDED_CODE_SIGN_IDENTITY:--}" --preserve-metadata=identifier,entitlements "$dst"
  fi
  printf '%s\n' "$name" >> "$next"
done

# Remove only products recorded by our previous build, never a user's frameworks.
if [ -f "$manifest" ]; then
  while IFS= read -r name; do
    case "$name" in ''|*[!A-Za-z0-9_.-]*) continue ;; esac
    case "$name" in *.framework) ;; *) continue ;; esac
    if ! /usr/bin/grep -Fqx -- "$name" "$next"; then
      rm -rf "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$name"
    fi
  done < "$manifest"
fi
mv "$next" "$manifest"
