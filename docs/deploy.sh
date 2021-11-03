#!/usr/bin/env bash

set -euo pipefail

scriptdir=$(dirname "${BASH_SOURCE[0]}")
bucket="docs.expo.dev"
target="${1-$scriptdir/out}"

if [ ! -d "$target" ]; then
  echo "target $target not found"
  exit 1
fi


# To keep the previous website up and running, we deploy it using these steps.
#   1.  Sync Next.js static assets in \`_next/**\` folder
#      > Uploads the new generated JS and asset files (stored in hashed folders to avoid collision with older deployments)
#   2.  Sync assets in \`static/**\` folder
#   3. Overwrite HTML dependents, not located in \`_next/**\` or \`static/**\` folder
#      > Force overwrite of all HTML files to make sure we use the latest one
#   4. Sync assets and clean up outdated files from previous deployments
#   5. Add custom redirects
#   6. Notify Google of sitemap changes for SEO

echo "::group::[1/6] Sync Next.js static assets in \`_next/**\` folder"
aws s3 sync \
  --no-progress \
  --exclude "*" \
  --include "_next/**" \
  --cache-control "public, max-age=31536000, immutable" \
  "$target" \
  "s3://${bucket}"
echo "::endgroup::"

echo "::group::[2/6] Sync assets in \`static/**\` folder"
aws s3 sync \
  --no-progress \
  --exclude "*" \
  --include "static/**" \
  --cache-control "public, max-age=3600" \
  "$target" \
  "s3://${bucket}"
echo "::endgroup::"

# Due to a bug with `aws s3 sync` we need to copy everything first instead of syncing
# see: https://github.com/aws/aws-cli/issues/3273#issuecomment-643436849
echo "::group::[3/6] Overwrite HTML dependents, not located in \`_next/**\` or \`static/**\` folder"
aws s3 cp \
  --no-progress \
  --recursive \
  --exclude "_next/**" \
  --exclude "static/**" \
  "$target" \
  "s3://${bucket}"
echo "::endgroup::"

echo "::group::[4/6] Sync assets and clean up outdated files from previous deployments"
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
# Migrated FAQ pages
redirects[faq/image-background]=ui-programming/image-background/
redirects[faq/react-native-styling-buttons]=ui-programming/react-native-styling-buttons/
redirects[faq/react-native-version-mismatch]=troubleshooting/react-native-version-mismatch/
redirects[faq/clear-cache-windows]=troubleshooting/clear-cache-windows/
redirects[faq/clear-cache-macos-linux]=troubleshooting/clear-cache-macos-linux/
redirects[faq/application-has-not-been-registered]=troubleshooting/application-has-not-been-registered/
redirects[distribution/building-standalone-apps]=classic/building-standalone-apps/
redirects[distribution/webhooks]=build-reference/build-webhook/
redirects[distribution/turtle-cli]=classic/turtle-cli/
redirects[distribution/app-signing]=app-signing/app-credentials/
redirects[guides/adhoc-builds]=archived/adhoc-builds/

echo "::group::[5/6] Add custom redirects"
for i in "${!redirects[@]}" # iterate over keys
do
  aws s3 cp \
    --no-progress \
    --metadata-directive REPLACE \
    --website-redirect "/${redirects[$i]}" \
    "$target/404.html" \
    "s3://${bucket}/${i}"

  # Also add redirects for paths without `.html` or `/`
  # S3 translates URLs with trailing slashes to `path/` -> `path/index.html`
  if [[ $i != *".html" ]] && [[ $i != *"/" ]]; then
    aws s3 cp \
      --no-progress \
      --metadata-directive REPLACE \
      --website-redirect "/${redirects[$i]}" \
      "$target/404.html" \
      "s3://${bucket}/${i}/index.html"
  fi
done
echo "::endgroup::"


echo "::group::[6/6] Notify Google of sitemap changes"
curl -m 15 "https://www.google.com/ping\?sitemap\=https%3A%2F%2F${bucket}%2Fsitemap.xml"
echo "\n::endgroup::"
