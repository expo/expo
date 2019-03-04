#!/usr/bin/env nix-shell
#!nix-shell -I nixpkgs=../../nix --packages direnv procps git yarn -i "direnv exec . bash"
set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD)"
# replace all the uppercase letters with lowercased equivalents
lowercased_branch="$(tr '[:upper:]' '[:lower:]' <<< $branch)"
# replace all the invalid characters with _
escaped_branch="$(sed s/[^a-z\d_.-]/_/g <<< $lowercased_branch)"
# strip non-letters and non-digits from the beginning of the string
validated_branch="$(sed s/^[^a-z\d]*// <<< $escaped_branch)"
channel=${1:-$validated_branch}

# Run yarn install in root, so linked dependencies are built
pushd ../..
for i in {1..3}; do ((i > 1)) && sleep 5; yarn install && break; done
popd

export EXPO_DEBUG=true

# Both of these variables are necessary to publish with sdkVersion "UNVERSIONED"
export EXPO_SKIP_MANIFEST_VALIDATION_TOKEN=true
export EXPO_NO_DOCTOR=true

yarn run expo login --username "$EXPO_CI_ACCOUNT_USERNAME" --password "$EXPO_CI_ACCOUNT_PASSWORD"
yarn run expo publish --release-channel "$channel"
