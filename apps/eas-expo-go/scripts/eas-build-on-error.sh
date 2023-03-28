#!/usr/bin/env bash

set -xeuo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../.. && pwd )"
export PATH="$ROOT_DIR/bin:$PATH"

notify_slack() {
  if [[ ! -z "$SLACK_HOOK" ]]; then
    curl \
      -X POST \
      -H 'Content-type: application/json' \
      --data "{ \"text\": \"$1\", \"attachments\": [ { \"text\": \"$2\", \"color\": \"danger\" } ] }" \
      $SLACK_HOOK
  else
    echo "SLACK_HOOK is not defined, skip sending slack notification."
    echo "TITLE: $1"
    echo "MESSAGE: $2"
  fi
}

SLUG="unversioned-expo-go"
if [[ "$EAS_BUILD_PROFILE" == "versioned-client" ]]; then
  SLUG="versioned-expo-go"
elif [[ "$EAS_BUILD_PROFILE" == "versioned-client-add-sdk" ]]; then
  SLUG="versioned-expo-go-add-sdk"
elif [[ "$EAS_BUILD_PROFILE" == "release-client" ]] || [[ "$EAS_BUILD_PROFILE" == "publish-client" ]]; then
  SLUG="release-expo-go"
fi
COMMIT_HASH="$(git rev-parse HEAD)"
COMMIT_AUTHOR="$(git log --pretty=format:"%an - %ae" | head -n 1)"

EAS_BUILD_MESSAGE_PART="EAS Build: <https://expo.dev/accounts/expo-ci/projects/$SLUG/builds/$EAS_BUILD_ID|$EAS_BUILD_ID>"
GITHUB_MESSAGE_PART="GitHub: <https://github.com/expo/expo/commit/$COMMIT_HASH|$COMMIT_HASH>"

TITLE="Expo Go build failed. (platform: $EAS_BUILD_PLATFORM, profile: $EAS_BUILD_PROFILE)"
MESSAGE="Release triggered by: $EAS_BUILD_USERNAME\\nCommit author: $COMMIT_AUTHOR\\n$EAS_BUILD_MESSAGE_PART\\n$GITHUB_MESSAGE_PART"

notify_slack "$TITLE" "$MESSAGE"
