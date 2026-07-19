#!/usr/bin/env bash

# Early exit when script is run on platforms other than macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  exit 0
fi

pathsToCheck=("ios" "apps/bare-expo/ios")

# Hooks pass a commit range; skip when no Podfile.lock changed within it.
if [[ -n "$1" && -n "$2" ]]; then
  lockfiles=()
  for path in "${pathsToCheck[@]}"; do
    lockfiles+=("$path/Podfile.lock")
  done
  if git diff --quiet "$1" "$2" -- "${lockfiles[@]}" 2>/dev/null; then
    exit 0
  fi
fi

green="tput setaf 2"
yellow="tput setaf 3"
blue="tput setaf 4"
reset="tput sgr0"

pathsToUpdate=()

for path in ${pathsToCheck[@]}; do
  podfileLockPath="$path/Podfile.lock"
  manifestLockPath="$path/Pods/Manifest.lock"
  podfileLock=$(md5 -q "$podfileLockPath" 2>/dev/null)
  manifestLock=$(md5 -q $manifestLockPath 2>/dev/null)

  if [ "$podfileLock" != "$manifestLock" ]; then
    pathsToUpdate+=($path)
  fi
done

if [ ${#pathsToUpdate[@]} -ne 0 ]; then
  dirs=$(printf " or $($green)%s$($yellow)" "${pathsToUpdate[@]}")
  printf "\\n⚠️  $($yellow)Update your local CocoaPods with $($blue)et pod-install$($yellow) if you're working in "
  printf "${dirs:4}$($reset)\\n"
fi
