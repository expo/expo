#!/usr/bin/env bash

set -euo pipefail

scriptdir=$(dirname "${BASH_SOURCE[0]}")
bucket="$AWS_BUCKET"
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
# redirects[requests/for/this/path]=are/redirected/to/this/one

# Temporarily create a redirect for a page that Home links to
redirects[versions/latest/introduction/installation.html]=versions/latest/introduction/installation
# useful link on twitter
redirects[versions/latest/guides/app-stores.html]=versions/latest/distribution/app-stores
# Xdl caches
redirects[versions/latest/guides/offline-support.html]=versions/latest/guides/offline-support
# xdl convert comment
redirects[versions/latest/sdk/index.html]=versions/latest/sdk/overview
# upgrading expo -> upgrading sdk walkthrough
redirects[versions/latest/workflow/upgrading-expo]=versions/latest/workflow/upgrading-expo-sdk-walkthrough
# rename
redirects[versions/latest/sdk/haptic/index.html]=versions/latest/sdk/haptics
redirects[development/eas-build]=development/build
# duplicate docs file, consolidate into one page
redirects[versions/latest/sdk/introduction/index.html]=versions/latest/sdk/overview
# project-lifecycle is now covered by managed-vs-bare
redirects[versions/latest/introduction/project-lifecycle]=archive/managed-vs-bare

# Migrated FAQ pages
redirects[faq/image-background]=ui-programming/image-background
redirects[faq/react-native-styling-buttons]=ui-programming/react-native-styling-buttons
redirects[faq/react-native-version-mismatch]=troubleshooting/react-native-version-mismatch
redirects[faq/clear-cache-windows]=troubleshooting/clear-cache-windows
redirects[faq/clear-cache-macos-linux]=troubleshooting/clear-cache-macos-linux
redirects[faq/application-has-not-been-registered]=troubleshooting/application-has-not-been-registered
redirects[distribution/building-standalone-apps]=archive/classic-builds/building-standalone-apps
redirects[build-reference/build-webhook]=eas/webhooks
redirects[distribution/webhooks]=eas/webhooks
redirects[distribution/turtle-cli]=archive/classic-builds/turtle-cli
redirects[distribution/app-signing]=app-signing/app-credentials
redirects[guides/adhoc-builds]=develop/development-builds/introduction
redirects[archive/adhoc-builds]=develop/development-builds/introduction

# clients is now development
redirects[clients/distribution-for-ios]=develop/development-builds/create-a-build
redirects[clients/distribution-for-android]=develop/development-builds/create-a-build
redirects[clients/compatibility]=develop/development-builds/introduction
redirects[development/compatibility]=develop/development-builds/introduction
redirects[clients/development-workflows]=development/development-workflows
redirects[clients/eas-build]=build/introduction
redirects[clients/extending-the-dev-menu]=develop/development-builds/development-workflows
redirects[clients/getting-started]=develop/development-builds/introduction
redirects[clients/installation]=develop/development-builds/create-a-build
redirects[clients/introduction]=develop/development-builds/introduction
redirects[clients/troubleshooting]=development/troubleshooting
redirects[clients/upgrading]=development/upgrading

# Expo Modules
redirects[modules]=modules/overview
redirects[module-api]=modules/module-api
redirects[module-config]=modules/module-config

# EAS Metadata
redirects[eas-metadata]=eas/metadata
redirects[eas-metadata/introduction]=eas/metadata
redirects[eas-metadata/getting-started]=eas/metadata/getting-started
# EAS Build
redirects[build-reference/eas-json]=eas/json

# Development builds
redirects[development/build]=develop/development-builds/create-a-build
redirects[development/getting-started]=develop/development-builds/create-a-build
redirects[development/troubleshooting]=develop/development-builds/introduction
redirects[development/upgrading]=develop/development-builds/introduction
redirects[development/extensions]=develop/development-builds/development-workflows
redirects[development/develop-your-project]=develop/development-builds/use-development-builds
redirects[develop/development-builds/installation]=develop/development-builds/create-a-build

# Guides that have been deleted
redirects[guides/using-gatsby]=guides/overview
redirects[guides/testing-on-devices]=workflow/run-on-device
redirects[distribution/uploading-apps]=submit/introduction
redirects[guides/setup-native-firebase]=guides/using-firebase
redirects[guides/using-clojurescript]=guides/overview
redirects[distribution/hosting-your-app]=distribution/publishing-websites
redirects[guides/web-performance/]=guides/analyzing-bundles
redirects[accounts/working-together]=accounts/account-types

# Redirects after adding Home to the docs
redirects[next-steps/additional-resources]=additional-resources
redirects[get-started/create-a-new-app]=get-started/create-a-project
redirects[guides/config-plugins]=config-plugins/introduction
redirects[workflow/debugging]=debugging/runtime-issues
redirects[guides/userinterface]=ui-programming/user-interface-libraries
redirects[introduction/expo]=core-concepts
redirects[introduction/faq]=faq
redirects[workflow/expo-go]=get-started/expo-go
redirects[errors-and-warnings]=debugging/errors-and-warnings
redirects[guides/splash-screens]=develop/user-interface/splash-screen
redirects[guides/app-icons]=develop/user-interface/app-icons
redirects[guides/color-schemes]=develop/user-interface/color-themes
redirects[development/introduction]=develop/development-builds/introduction
redirects[development/create-development-builds]=develop/development-builds/create-a-build
redirects[development/use-development-builds]=develop/development-builds/use-development-builds
redirects[development/development-workflows]=develop/development-builds/development-workflows
redirects[debugging]=debugging/runtime-issues
redirects[debugging/runtime-issue]=debugging/runtime-issues
redirects[workflow/glossary-of-terms]=more/glossary-of-terms
redirects[develop/development-builds/installation]=develop/development-builds/create-a-build
redirects[get-started/errors]=debugging/errors-and-warnings
redirects[develop/development-builds/parallel-installation]=build-reference/variants
redirects[home/develop/user-interface/safe-areas]=develop/user-interface/safe-areas
redirects[home/develop/development-builds/introduction]=develop/development-builds/introduction

# Redirects after Guides organization
redirects[guides]=guides/overview
redirects[guides/routing-and-navigation]=routing/introduction
redirects[guides/errors]=debugging/runtime-issues
redirects[workflow/expo-cli]=more/expo-cli
redirects[versions/latest/workflow/expo-cli]=more/expo-cli
redirects[bare/hello-world]=bare/overview
redirects[guides/using-graphql]=guides/overview
redirects[build/automating-submissions]=build/automate-submissions
redirects[workflow/run-on-device]=build/internal-distribution
redirects[archive/workflow/customizing]=workflow/customizing
redirects[guides/building-standalone-apps]=archive/classic-builds/building-standalone-apps
redirects[versions/latest/sdk/permissions#expopermissionscamera_roll]=guides/permissions
redirects[introduction/managed-vs-bare]=archive/managed-vs-bare
redirects[push-notifications/using-fcm]=push-notifications/push-notifications-setup
redirects[guides/using-custom-fonts]=develop/user-interface/fonts

# Redirects reported from SEO tools list (MOZ, SEMRush, GSC, etc.)
redirects[versions/v46.0.0/sdk/permissions]=guides/permissions
redirects[development/development-workflows]=develop/development-builds/development-workflows
redirects[bare/installing-unimodules]=bare/installing-expo-modules
redirects[versions/latest/sdk/admob]=versions/latest
redirects[workflow/publishing]=archive/classic-updates/publishing
redirects[workflow/already-used-react-native]=workflow/overview
redirects[guides/setup-native-firebase]=guides/using-firebase
redirects[eas-update/how-eas-update-works]=eas-update/how-it-works
redirects[development/installation]=develop/development-builds/create-a-build
redirects[bare/updating-your-app]=eas-update/updating-your-app
redirects[versions/latest/introduction/managed-vs-bare]=archive/managed-vs-bare
redirects[classic/turtle-cli]=archive/classic-builds/turtle-cli
redirects[technical-specs/expo-updates-0]=technical-specs/expo-updates-1
redirects[development/extending-the-dev-menu]=develop/development-builds/development-workflows
redirects[archive/expokit/eject]=archive/glossary
redirects[archive/expokit/overview]=archive/glossary
redirects[expokit/overview]=archive/glossary
redirects[more/latest]=versions/latest
redirects[versions/latest/sdk/error-recovery]=versions/latest
redirects[eas-update/eas-update-with-local-build]=eas-update/build-locally
redirects[bare/existing-apps]=bare/installing-expo-modules
redirects[bare/exploring-bare-workflow]=bare/overview
redirects[home/develop/development-builds/installation]=develop/development-builds/create-a-build
redirects[t/cant-upgrade-to-the-lastest-expo-cli-3-19-2]=faq
redirects[build-reference/custom-build-config]=custom-builds/get-started
redirects[home/debugging/tools]=debugging/tools
redirects[workflow/run-on-device]=build/internal-distribution
redirects[build-reference/how-tos]=build-reference/private-npm-packages
redirects[home/navigation/installation]=routing/introduction
redirects[home/authentication]=develop/authentication
redirects[home/develop/user-interface/app-icons]=develop/user-interface/app-icons
redirects[eas-update/migrate-codepush-to-eas-update]=eas-update/codepush
redirects[home/get-started/create-a-project]=get-started/create-a-project
redirects[home/core-concepts]=core-concepts
redirects[guides/testing-on-devices]=build/internal-distribution
redirects[router/advance/root-layout]=router/advanced/root-layout
redirects[router/advance/stack]=router/advanced/stack
redirects[router/advance/tabs]=router/advanced/tabs
redirects[router/advance/drawer]=router/advanced/drawer
redirects[router/advance/nesting-navigators]=router/advanced/nesting-navigators
redirects[router/advance/modal]=router/advanced/modals
redirects[router/advance/platform-specific-modules]=router/advanced/platform-specific-modules
redirects[router/advance/shared-routes]=router/advanced/shared-routes
redirects[router/advance/router-setttings]=router/advanced/router-settings
redirects[home/config-plugins/plugins-and-mods]=config-plugins/plugins-and-mods
redirects[home/unit-testing]=develop/unit-testing
redirects[home/config-plugins/introduction]=config-plugins/introduction
redirects[technical-specs/latest]=technical-specs/expo-updates-1
redirects[guides/education]=additional-resources

# We should change this redirect to a more general EAS guide later
redirects[guides/setting-up-continuous-integration]=build/building-on-ci

# Moved classic updates
redirects[distribution/release-channels]=archive/classic-updates/release-channels
redirects[distribution/advanced-release-channels]=archive/classic-updates/advanced-release-channels
redirects[distribution/optimizing-updates]=archive/classic-updates/optimizing-updates
redirects[guides/offline-support]=archive/classic-updates/offline-support
redirects[guides/preloading-and-caching-assets]=archive/classic-updates/preloading-and-caching-assets
redirects[guides/configuring-updates]=archive/classic-updates/configuring-updates
redirects[eas-update/bare-react-native]=eas-update/updating-your-app
redirects[worfkflow/publishing]=archive/classic-updates/publishing
redirects[classic/building-standalone-apps]=archive/classic-builds/building-standalone-apps
redirects[classic/turtle-cli]=archive/classic-builds/turtle-cli
redirects[build-reference/migrating]=archive/classic-builds/migrating
redirects[archive/classic-updates/getting-started]=eas-update/getting-started
redirects[archived]=archive
redirects[archive/classic-updates/building-standalone-apps]=archive/classic-builds/building-standalone-apps

# Old tutorial pages
redirects[introduction/walkthrough]=tutorial/introduction
redirects[tutorial/planning]=tutorial/introduction
redirects[tutorial/sharing]=tutorial/introduction
redirects[tutorial/text]=tutorial/introduction
redirects[tutorial/button]=tutorial/introduction

# EAS Update
redirects[technical-specs/expo-updates-0]=archive/technical-specs/expo-updates-0
redirects[eas-update/developing-with-eas-update]=eas-update/develop-faster
redirects[eas-update/eas-update-with-local-build]=eas-update/build-locally
redirects[eas-update/eas-update-and-eas-cli]=eas-update/eas-cli
redirects[eas-update/debug-updates]=eas-update/debug
redirects[eas-update/how-eas-update-works]=eas-update/how-it-works
redirects[eas-update/migrate-to-eas-update]=eas-update/migrate-from-classic-updates
redirects[distribution/custom-updates-server]=eas-update/custom-updates-server
redirects[bare/error-recovery]=eas-update/error-recovery

# Redirects after Expo Router docs reorganization from Home to Guides
redirects[routing/next-steps]=router/introduction
redirects[routing/introduction]=router/introduction
redirects[routing/installation]=router/installation
redirects[routing/create-pages]=router/create-pages
redirects[routing/navigating-pages]=router/navigating-pages
redirects[routing/layouts]=router/layouts
redirects[routing/appearance]=router/appearance
redirects[routing/error-handling]=router/error-handling

# Removed API reference docs
redirects[versions/latest/sdk/facebook]=guides/authentication
redirects[versions/latest/sdk/taskmanager]=versions/latest/sdk/task-manager
redirects[versions/latest/sdk/videothumbnails]=versions/latest/sdk/video-thumbnails
redirects[versions/latest/sdk/appearance]=versions/latest/react-native/appearance
redirects[versions/latest/sdk/app-loading]=versions/latest/sdk/splash-screen
redirects[versions/latest/sdk/app-auth]=guides/authentication
redirects[versions/latest/sdk/firebase-core]=guides/using-firebase
redirects[versions/latest/sdk/firebase-analytics]=guides/using-firebase
redirects[versions/latest/sdk/firebase-recaptcha]=guides/using-firebase
redirects[versions/latest/sdk/google-sign-in]=guides/authentication
redirects[versions/latest/sdk/google]=guides/authentication
redirects[versions/latest/sdk/amplitude]=guides/using-analytics
redirects[versions/latest/sdk/util]=versions/latest
redirects[versions/v45.0.0/sdk/google-sign-in]=guides/google-authentication
redirects[versions/v44.0.0/sdk/google]=guides/google-authentication
redirects[versions/latest/introduction/faq]=faq
redirects[versions/v50.0.0/sdk/in-app-purchases]=guides/in-app-purchases/
redirects[versions/latest/sdk/in-app-purchases]=guides/in-app-purchases/

# Redirects based on Sentry reports
redirects[push-notifications]=push-notifications/overview
redirects[eas/submit]=submit/introduction
redirects[development/tools/expo-dev-client]=develop/development-builds/introduction
redirects[develop/user-interface/custom-fonts]=develop/user-interface/fonts
redirects[workflow/snack]=/more/glossary-of-terms
redirects[accounts/teams-and-accounts]=accounts/account-types
redirects[push-notifications/fcm]=push-notifications/sending-notifications-custom
redirects[troubleshooting/clear-cache-mac]=troubleshooting/clear-cache-macos-linux
redirects[guides/using-preact]=guides/overview
redirects[versions/latest/sdk/shared-element]=versions/latest
redirects[workflow/hermes]=guides/using-hermes

# Redirects based on Algolia 404 report
redirects[versions/latest/sdk/permissions]=guides/permissions
redirects[versions/v47.0.0/sdk/permissions]=guides/permissions
redirects[versions/v46.0.0/sdk/permissions.md]=guides/permissions
redirects[workflow/build/building-on-ci]=build/building-on-ci
redirects[versions/v50.0.0/sdk/taskmanager]=versions/v50.0.0/sdk/task-manager
redirects[versions/v49.0.0/sdk/taskmanager]=versions/v49.0.0/sdk/task-manager
redirects[versions/v48.0.0/sdk/taskmanager]=versions/v48.0.0/sdk/task-manager
redirects[versions/v47.0.0/sdk/taskmanager]=versions/latest/sdk/task-manager
redirects[versions/v46.0.0/sdk/taskmanager]=versions/latest/sdk/task-manager
redirects[task-manager]=versions/latest/sdk/task-manager
redirects[versions/v49.0.0/sdk/filesystem.md]=versions/v49.0.0/sdk/filesystem
redirects[versions/v48.0.0/sdk/filesystem.md]=versions/v48.0.0/sdk/filesystem
redirects[versions/v47.0.0/sdk/filesystem.md]=versions/latest/sdk/filesystem
redirects[versions/v46.0.0/sdk/filesystem.md]=versions/latest/sdk/filesystem
redirects[versions/latest/sdk/filesystem.md]=versions/latest/sdk/filesystem
redirects[versions/v48.0.0/sdk]=versions/latest
redirects[versions/v48.0.0/sdk/config/app]=versions/v48.0.0/config/app
redirects[guides/how-expo-works]=faq
redirects[config/app]=workflow/configuration
redirects[versions/v50.0.0/sdk]=versions/v50.0.0
redirects[versions/v49.0.0/sdk]=versions/v49.0.0
redirects[versions/v47.0.0/sdk]=versions/latest
redirects[versions/v46.0.0/sdk]=versions/latest
redirects[guides/authentication.md]=guides/authentication
redirects[versions/latest/workflow/linking/]=guides/linking
redirects[versions/latest/sdk/overview]=versions/latest

# Deprecated webpack
redirects[guides/customizing-webpack]=archive/customizing-webpack

# Stop encouraging usage of Expo Go when using native modules
redirects[bare/using-expo-client]=archive/using-expo-client

# May 2024 home / get started section
redirects[/overview]=get-started/introduction
redirects[/get-started/installation]=get-started/create-a-project
redirects[/get-started/expo-go]=get-started/set-up-your-environment
redirects[/get-started/create-a-project]=get-started/create-a-project


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


if [ "$bucket" = "docs.expo.dev" ]; then
  echo "::group::[6/6] Notify Google of sitemap changes"
  curl -m 15 "https://www.google.com/ping\?sitemap\=https%3A%2F%2F${bucket}%2Fsitemap.xml"
  echo "\n::endgroup::"
fi
