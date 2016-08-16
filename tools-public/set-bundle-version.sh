#!/bin/bash

clear=0

OPTIND=1
while getopts "hc" opt; do
  case "$opt" in
    h|\?)
      echo 'Usage: set-bundle-version [-c]'
      exit 0
      ;;
    c)
      clear=1
      ;;
    esac
done
shift $((OPTIND-1))

if [ $clear -eq 0 ] ; then
  VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "${PROJECT_DIR}/${INFOPLIST_FILE}")
  COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null)
  BUILD_VERSION="${VERSION}.10${COMMIT_COUNT}"
  /usr/libexec/PlistBuddy -c "Delete :CFBundleVersion" "${PROJECT_DIR}/${INFOPLIST_FILE}"
  /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $BUILD_VERSION" "${PROJECT_DIR}/${INFOPLIST_FILE}"
else
   /usr/libexec/PlistBuddy -c "Delete :CFBundleVersion" "${PROJECT_DIR}/${INFOPLIST_FILE}"
fi
