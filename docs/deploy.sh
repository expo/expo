#!/usr/bin/env bash

set -euo pipefail

scriptdir=$(dirname "${BASH_SOURCE[0]}")
bucket="docs.expo.io"
target="${1-$scriptdir/out}"

if [ ! -d "$target" ]; then
  echo "target $target not found"
  exit 1
fi

# To keep the previous website up and running, we deploy it using these steps.
#   1. Upload JS files in \`_next/**\` folder
#      > Uploads the new generated JS files, containing hashes to not-collide with previous deployment
#   2. Upload new asset files in \`static/**\` folder
#      > Contains large files and might take some/slow down overwrite of HTML files
#   3. Overwrite all HTML and other files, not located in \`_next/**\` or \`static/**\` folder
#      > Switches the website over to the new JS/asset files
#   4. Clean up outdated files from previous deployments
#   5. Add custom redirects

# Due to a bug with `aws s3 sync` we need to copy everything first instead of syncing
# see: https://github.com/aws/aws-cli/issues/3273#issuecomment-643436849

echo "::group::[1/5] Upload JS files in \`_next/**\` folder"
aws s3 cp \
  --no-progress \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable" \
  "$target/_next/" \
  "s3://${bucket}/_next/"
echo "::endgroup::"

echo "::group::[2/5] Upload new asset files in \`static/**\` folder"
aws s3 cp \
  --no-progress \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable" \
  "$target/static/" \
  "s3://${bucket}/static/"
echo "::endgroup::"

echo "::group::[3/5] Overwrite all HTML and other files, not located in \`_next/**\` or \`static/**\` folder"
aws s3 cp \
  --no-progress \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "_next/**" \
  --exclude "static/**" \
  "$target" \
  "s3://${bucket}"
echo "::endgroup::"

echo "::group::[4/5] Clean up outdated files from previous deployments"
aws s3 sync \
  --no-progress \
  --delete \
  "$target" \
  "s3://${bucket}"
echo "::endgroup::"

declare -A redirects # associative array variable

# usage:
# redicts[requests/for/this/path]=are/redirected/to/this/one

# Temporarily create a redirect for a page that Home links to
redirects[versions/latest/introduction/installation.html]=versions/latest/introduction/installation/
# useful link on twitter
redirects[versions/latest/guides/app-stores.html]=versions/latest/distribution/app-stores/
# Xdl caches
redirects[versions/latest/guides/offline-support.html]=versions/latest/guides/offline-support/
# xdl convert comment
redirects[versions/latest/sdk/index.html]=versions/latest/sdk/overview/
# upgrading expo -> upgrading sdk walkthrough
redirects[versions/latest/workflow/upgrading-expo]=versions/latest/workflow/upgrading-expo-sdk-walkthrough/
# rename
redirects[versions/latest/sdk/haptic/index.html]=versions/latest/sdk/haptics/
# duplicate docs file, consolidate into one page
redirects[versions/latest/sdk/introduction/index.html]=versions/latest/sdk/overview/
# project-lifecycle is now covered by managed-vs-bare
redirects[versions/latest/introduction/project-lifecycle/]=versions/latest/introduction/managed-vs-bare/
# exp-cli is now expo-cli
redirects[versions/latest/guides/exp-cli.html]=versions/latest/workflow/expo-cli/
redirects[versions/latest/guides/exp-cli]=versions/latest/workflow/expo-cli/

echo "::group::[5/5] Add custom redirects"
for i in "${!redirects[@]}" # iterate over keys
do
  aws s3 cp \
    --no-progress \
    --metadata-directive REPLACE \
    --website-redirect "/${redirects[$i]}" \
    "$target/404.html" \
    "s3://${bucket}/${i}"
done
echo "::endgroup::"
