#!/usr/bin/env bash

# Early exit when script is run on platforms other than macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  exit 0
fi

green="tput setaf 2"
yellow="tput setaf 3"
blue="tput setaf 4"
reset="tput sgr0"

pathsToCheck=("ios" "apps/bare-expo/ios")
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
