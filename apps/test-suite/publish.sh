#!/usr/bin/env nix-shell
#!nix-shell -I nixpkgs=../../nix --packages rsync procps git nodejs yarn zsh -i zsh

set -euo pipefail

eval "$(direnv hook zsh)"

commit_hash="$(git rev-parse HEAD)"

# Run yarn install in root, so linked dependencies are built
pushd ../..
for i in {1..3}; do ((i > 1)) && sleep 5; yarn install && break; done
popd

export EXPO_DEBUG=true

# Both of these variables are necessary to publish with sdkVersion "UNVERSIONED"
export EXPO_SKIP_MANIFEST_VALIDATION_TOKEN=true
export EXPO_NO_DOCTOR=true

yarn run --silent expo login --username "$EXPO_CI_ACCOUNT_USERNAME" --password "$EXPO_CI_ACCOUNT_PASSWORD"
yarn run expo publish --non-interactive --release-channel "$commit_hash"
