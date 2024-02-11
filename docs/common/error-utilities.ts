import versions from '~/public/static/constants/versions.json';

export function getRedirectPath(redirectPath: string): string {
  // index.html is no longer a thing in our docs
  if (pathIncludesIndexHtml(redirectPath)) {
    redirectPath = redirectPath.replace('index.html', '');
  }

  // Remove the .html extension if it is included in the path
  if (pathIncludesHtmlExtension(redirectPath)) {
    redirectPath = redirectPath.replace('.html', '');
  }

  // Unsure why this is happening, but sometimes URLs end up with /null in
  // the last path part
  // https://docs.expo.dev/versions/latest/sdk/overview/null
  if (endsInNull(redirectPath)) {
    redirectPath = redirectPath.replace(/null$/, '');
  }

  // Add a trailing slash if there is not one
  if (redirectPath[redirectPath.length - 1] !== '/') {
    redirectPath = `${redirectPath}/`;
  }

  // A list of pages we know are renamed and can redirect
  if (RENAMED_PAGES[redirectPath]) {
    redirectPath = RENAMED_PAGES[redirectPath];
  }

  // Catch any unversioned paths which are also renamed
  if (isVersionedPath(redirectPath)) {
    const unversionedPath = removeVersionFromPath(redirectPath);
    if (RENAMED_PAGES[unversionedPath]) {
      redirectPath = RENAMED_PAGES[unversionedPath];
    }
  }

  // Check if the version is documented, replace it with latest if not
  if (!isVersionDocumented(redirectPath)) {
    redirectPath = replaceVersionWithLatest(redirectPath);
  }

  // Remove versioning from path if this section is no longer versioned
  if (isVersionedPath(redirectPath) && !pathRequiresVersioning(redirectPath)) {
    redirectPath = removeVersionFromPath(redirectPath);
  }

  // Catch any redirects to sdk paths without versions and send to the latest version
  if (redirectPath.startsWith('/sdk/')) {
    redirectPath = `/versions/latest${redirectPath}`;
  }

  // If a page is missing for react-native paths we redirect to react-native docs
  if (redirectPath.match(/\/versions\/.*\/react-native\//)) {
    const pathParts = redirectPath.split('/');
    const page = pathParts[pathParts.length - 2];
    redirectPath = `https://reactnative.dev/docs/${page}`;
  }

  // Remove version from path if the version is still supported, to redirect to the root
  if (isVersionedPath(redirectPath) && isVersionDocumented(redirectPath)) {
    redirectPath = `/versions/${getVersionFromPath(redirectPath)}/`;
  }

  return redirectPath;
}

function getVersionFromPath(path: string) {
  const pathParts = path.split(/\//);
  // eg: ["", "versions", "v32.0.0", ""]
  return pathParts[2];
}

// Filter unversioned and latest out, so we end up with v34, etc.
const supportedVersions = versions.VERSIONS.filter(v => v.match(/^v/));

// Return true if the version is still included in documentation
function isVersionDocumented(path: string) {
  return supportedVersions.includes(getVersionFromPath(path));
}

function pathIncludesHtmlExtension(path: string) {
  return !!path.match(/\.html$/);
}

function pathIncludesIndexHtml(path: string) {
  return !!path.match(/index\.html$/);
}

const VERSION_PART_PATTERN = `(latest|unversioned|v\\d+\\.\\d+.\\d+)`;
const VERSIONED_PATH_PATTERN = `^\\/versions\\/${VERSION_PART_PATTERN}`;
const SDK_PATH_PATTERN = `${VERSIONED_PATH_PATTERN}/sdk`;
const REACT_NATIVE_PATH_PATTERN = `${VERSIONED_PATH_PATTERN}/react-native`;

// Check if path is valid (matches /versions/some-valid-version-here/)
function isVersionedPath(path: string) {
  return !!path.match(new RegExp(VERSIONED_PATH_PATTERN));
}

// Replace an unsupported SDK version with latest
function replaceVersionWithLatest(path: string) {
  return path.replace(new RegExp(VERSION_PART_PATTERN), 'latest');
}

/**
 * Determine if the path requires versioning, if not we can remove the versioned prefix from the path.
 * The following paths require versioning:
 *   - `/versions/<version>/sdk/**`, pages within the Expo SDK docs.
 *   - `/versions/<version>/react-native/**`, pages within the React Native API docs.
 *   - `/versions/<version>/`, the index of a specific Expo SDK version.
 * All other paths shouldn't require versioning, some of them are:
 *   - `/versions/<version>/workflow/expo-cli/, moved outside versioned folders.
 *   - `/versions/<version>/guides/assets/, moved outside versioned folders.
 */
function pathRequiresVersioning(path: string) {
  const isExpoSdkPage = path.match(new RegExp(SDK_PATH_PATTERN));
  const isExpoSdkIndexPage = path.match(new RegExp(VERSIONED_PATH_PATTERN + '/$'));
  const isReactNativeApiPage = path.match(new RegExp(REACT_NATIVE_PATH_PATTERN));

  return isExpoSdkIndexPage || isExpoSdkPage || isReactNativeApiPage;
}

function removeVersionFromPath(path: string) {
  return path.replace(new RegExp(VERSIONED_PATH_PATTERN), '');
}

// Not sure why this happens but sometimes the URL ends in /null
function endsInNull(path: string) {
  return !!path.match(/\/null$/);
}

// Simple remapping of renamed pages, similar to in deploy.sh but in some cases,
// for reasons I'm not totally clear on, those redirects do not work
const RENAMED_PAGES: Record<string, string> = {
  // Redirects after creating Home pages and route
  '/next-steps/additional-resources/': '/additional-resources/',
  '/get-started/create-a-new-app/': '/get-started/create-a-project',
  '/guides/config-plugins/': '/config-plugins/introduction/',
  '/workflow/debugging/': '/debugging/runtime-issues/',
  '/guides/userinterface/': '/ui-programming/user-interface-libraries/',
  '/introduction/expo/': '/core-concepts/',
  '/introduction/why-not-expo/': '/faq/#limitations',
  '/introduction/faq/': '/faq/',
  '/next-steps/community/': '/',
  '/introduction/managed-vs-bare/': '/archive/managed-vs-bare/',
  '/workflow/expo-go/': '/get-started/expo-go/',
  '/guides/splash-screens/': '/develop/user-interface/splash-screen/',
  '/guides/app-icons/': '/develop/user-interface/app-icons/',
  '/guides/color-schemes/': '/develop/user-interface/color-themes/',
  '/development/introduction/': '/develop/development-builds/introduction/',
  '/development/create-development-builds/': '/develop/development-builds/create-a-build/',
  '/development/use-development-builds/': '/develop/development-builds/use-development-builds/',
  '/development/development-workflows/': '/develop/development-builds/development-workflows/',
  '/workflow/expo-cli/': '/more/expo-cli/',
  '/versions/latest/workflow/expo-cli/': '/more/expo-cli/',
  '/debugging/': '/debugging/runtime-issues/',
  '/debugging/runtime-issue/': '/debugging/runtime-issues/',
  '/guides/testing-with-jest/': '/develop/unit-testing/',
  '/workflow/glossary-of-terms/': '/more/glossary-of-terms/',
  '/develop/development-builds/installation/': '/develop/development-builds/create-a-build/',
  '/get-started/errors/': '/debugging/errors-and-warnings/',
  '/develop/development-builds/parallel-installation': '/build-reference/variants/',
  '/home/develop/user-interface/safe-areas': '/develop/user-interface/safe-areas/',
  '/home/develop/development-builds/installation': '/develop/development-builds/create-a-build/',
  '/home/debugging/tools/': '/debugging/tools/',
  '/home/navigation/installation': '/routing/introduction/',
  '/home/authentication': '/develop/authentication/',
  '/home/get-started/create-a-project': '/get-started/create-a-project/',
  '/home/core-concepts/': '/core-concepts/',
  '/home/config-plugins/plugins-and-mods': '/config-plugins/plugins-and-mods/',
  '/home/unit-testing/': '/develop/unit-testing/',
  '/home/config-plugins/introduction/': '/config-plugins/introduction/',
  '/home/develop/user-interface/app-icons': '/develop/user-interface/app-icons/',
  '/home/develop/development-builds/introduction/': '/develop/development-builds/introduction/',

  // EAS Build
  '/build-reference/eas-json/': '/eas/json/#eas-build',

  // Old redirects
  '/introduction/project-lifecycle/': '/archive/managed-vs-bare/',
  '/versions/latest/sdk/': '/versions/latest/',
  '/versions/latest/sdk/overview/': '/versions/latest/',
  '/guides/building-standalone-apps/': '/archive/classic-builds/building-standalone-apps/',
  '/distribution/building-standalone-apps/': '/archive/classic-builds/building-standalone-apps/',
  '/guides/genymotion/': '/workflow/android-studio-emulator/',
  '/workflow/upgrading-expo/': '/workflow/upgrading-expo-sdk-walkthrough/',
  '/workflow/create-react-native-app/': '/more/glossary-of-terms/#create-react-native-app',
  '/expokit/': '/archive/glossary/#expokit/',
  '/build-reference/migrating/': '/archive/classic-builds/migrating/',

  // Development builds redirects
  '/development/build/': '/develop/development-builds/create-a-build/',
  '/development/getting-started/': '/develop/development-builds/create-a-build/',
  '/development/troubleshooting/': '/develop/development-builds/introduction/',
  '/development/upgrading/': '/develop/development-builds/introduction/',
  '/development/extensions/': '/develop/development-builds/development-workflows/',
  '/development/develop-your-project': '/develop/development-builds/use-development-builds/',

  // Consolidate workflow page
  '/bare/customizing/': '/workflow/customizing/',

  // Lots of old links pointing to guides when they have moved elsewhere
  '/guides/configuration/': '/workflow/configuration/',
  '/guides/expokit/': '/archive/glossary/#expokit/',
  '/guides/publishing/': '/archive/classic-updates/publishing/',
  '/workflow/publishing/': '/archive/classic-updates/publishing/',
  '/guides/linking/': '/workflow/linking/',
  '/guides/up-and-running/': '/get-started/installation/',
  '/guides/debugging/': '/debugging/runtime-issues/',
  '/guides/logging/': '/workflow/logging/',
  '/introduction/troubleshooting-proxies/': '/guides/troubleshooting-proxies/',
  '/introduction/running-in-the-browser/': '/guides/running-in-the-browser/',
  '/guides/using-electron/':
    'https://dev.to/evanbacon/making-desktop-apps-with-electron-react-native-and-expo-5e36',

  // Changes from redoing the getting started workflow, SDK35+
  '/workflow/up-and-running/': '/get-started/installation/',
  '/introduction/additional-resources/': '/next-steps/additional-resources/',
  '/introduction/already-used-react-native/':
    '/faq/#what-is-the-difference-between-expo-and-react-native',
  '/introduction/community/': '/next-steps/community/',
  '/introduction/installation/': '/get-started/installation/',
  '/versions/latest/overview/': '/versions/latest/',
  '/versions/latest/introduction/installation/': '/get-started/installation/',
  '/workflow/exploring-managed-workflow/': '/tutorial/introduction/',
  '/introduction/walkthrough/': '/tutorial/introduction/',

  // Redirects after Expo Router docs reorganization from Home to Guides
  '/routing/next-steps/': '/router/introduction/',
  '/routing/introduction/': '/router/introduction/',
  '/routing/installation/': '/router/installation/',
  '/routing/create-pages/': '/router/create-pages/',
  '/routing/navigating-pages/': '/router/navigating-pages/',
  '/routing/layouts/': '/router/layouts/',
  '/routing/appearance/': '/router/appearance/',
  '/routing/error-handling/': '/router/error-handling/',

  // Errors and debugging is better suited for getting started than tutorial
  '/tutorial/errors/': '/debugging/errors-and-warnings/',

  // Redirects based on Next 9 upgrade (09/11/2020)
  '/api/': '/versions/latest/',

  // Redirect to expand Expo Accounts and permissions
  '/guides/account-permissions/': '/accounts/personal/',

  // Redirects based on Sentry reports
  '/next-steps/installation/': '/get-started/installation/',
  '/guides/release-channels/': '/archive/classic-updates/release-channels/',
  '/guides/push-notifications/': '/push-notifications/overview/',
  '/push-notifications/': '/push-notifications/overview/',
  '/distribution/hosting-your-app/': '/distribution/publishing-websites/',
  '/build-reference/how-tos/': '/build-reference/private-npm-packages/',
  '/get-started/': '/get-started/installation/',
  '/guides/detach/': '/archive/glossary/#detach',
  '/workflow/snack/': '/more/glossary-of-terms/#snack',
  '/eas/submit/': '/submit/introduction/',
  '/development/tools/expo-dev-client/':
    '/develop/development-builds/introduction/#what-is-expo-dev-client',
  '/develop/user-interface/custom-fonts/': '/develop/user-interface/fonts/#use-a-custom-font',
  '/accounts/teams-and-accounts/': '/accounts/account-types/',
  '/push-notifications/fcm/': '/push-notifications/sending-notifications-custom/',
  '/troubleshooting/clear-cache-mac/': '/troubleshooting/clear-cache-macos-linux/',

  // Renaming a submit section
  '/submit/submit-ios': '/submit/ios/',
  '/submit/submit-android': '/submit/android/',

  // Fundamentals had too many things
  '/workflow/linking/': '/guides/linking/',
  '/workflow/how-expo-works/': '/faq/#what-is-the-difference-between-expo-and-react-native',
  '/guides/how-expo-works/': '/faq/#what-is-the-difference-between-expo-and-react-native',

  // Archive unused pages
  '/guides/notification-channels/': '/archived/notification-channels/',

  // Migrated FAQ pages
  '/faq/image-background/': '/ui-programming/image-background/',
  '/faq/react-native-styling-buttons/': '/ui-programming/react-native-styling-buttons/',
  '/faq/react-native-version-mismatch/': '/troubleshooting/react-native-version-mismatch/',
  '/faq/clear-cache-windows/': '/troubleshooting/clear-cache-windows/',
  '/faq/clear-cache-macos-linux/': '/troubleshooting/clear-cache-macos-linux/',
  '/faq/application-has-not-been-registered/':
    '/troubleshooting/application-has-not-been-registered/',

  // Permissions API is moved to guide
  '/versions/v40.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v41.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v42.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v43.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v46.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v47.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/latest/sdk/permissions/': '/guides/permissions/',

  // Redirect bare guides to unified workflow guides
  '/bare/using-libraries/': '/workflow/using-libraries/',
  '/bare/exploring-bare-workflow/': '/bare/overview/',
  '/bare/existing-apps/': '/bare/installing-expo-modules/',
  '/bare/installing-unimodules/': '/bare/installing-expo-modules/',
  '/bare/using-web/': '/workflow/web/',
  '/guides/running-in-the-browser/': '/workflow/web/',
  '/bare/unimodules-full-list/': '/bare/overview/',
  '/bare/updating-your-app/': '/eas-update/updating-your-app/',

  // Consolidate distribution
  '/distribution/security/': '/app-signing/security/',
  '/distribution/uploading-apps/': '/submit/introduction/',
  '/versions/latest/distribution/uploading-apps/': '/submit/introduction/',

  // Redirects for removed/archived pages or guides
  '/archived/': '/archive/',
  '/guides/using-gatsby/': '/guides/overview',
  '/versions/latest/expokit/eject/': '/archive/glossary/#eject',
  '/expokit/eject/': '/archive/glossary/#eject',
  '/expokit/expokit/': '/archive/glossary/#expokit',
  '/submit/classic-builds/': '/submit/introduction/',
  '/archive/adhoc-builds/': '/develop/development-builds/introduction/',
  '/technical-specs/expo-updates-0/': '/technical-specs/expo-updates-1/',
  '/technical-specs/latest/': '/technical-specs/expo-updates-1/',
  '/development/extending-the-dev-menu/': '/develop/development-builds/development-workflows/',
  '/more/latest': '/versions/latest/',
  '/archive/expokit/overview/': '/archive/glossary/',
  '/expokit/overview/': '/archive/glossary/',
  '/tutorial/planning/': '/tutorial/introduction/',
  '/tutorial/sharing/': '/tutorial/introduction/',
  '/tutorial/text/': '/tutorial/introduction/',
  '/tutorial/button': '/tutorial/introduction/',
  '/guides/using-clojurescript/': '/guides/overview',
  '/push-notifications/using-fcm/': '/push-notifications/push-notifications-setup/',
  '/guides/using-custom-fonts/': '/develop/user-interface/fonts/',
  '/workflow/already-used-react-native/': '/workflow/overview/',
  '/guides/setup-native-firebase/': '/guides/using-firebase/',
  '/development/installation/': '/develop/development-builds/create-a-build/',
  '/guides/routing-and-navigation/': '/routing/introduction/',
  '/build-reference/custom-build-config/': '/custom-builds/get-started/',
  '/eas-update/migrate-codepush-to-eas-update/': '/eas-update/codepush/',
  '/guides/testing-on-devices': '/build/internal-distribution/',
  '/bare/hello-world/': '/bare/overview/',
  '/guides/errors/': '/debugging/runtime-issues/',
  '/guides/using-graphql/': '/guides/overview/',
  '/guides/using-styled-components/': '/guides/overview/',
  '/build/automating-submissions/': '/build/automate-submissions/',
  '/workflow/run-on-device/': '/build/internal-distribution/',
  '/guides/': '/guides/overview/',
  '/archive/workflow/customizing/': '/workflow/customizing/',
  '/errors-and-warnings/': '/debugging/errors-and-warnings/',
  '/guides/education': '/additional-resources/',
  '/versions/latest/sdk/in-app-purchases/': '/guides/in-app-purchases/',
  '/versions/v50.0.0/sdk/in-app-purchases/': '/guides/in-app-purchases/',
  '/guides/web-performance/': '/guides/analyzing-bundles/',

  // Classic updates moved to archive
  '/guides/configuring-ota-updates/': '/archive/classic-updates/getting-started/',
  '/guides/configuring-updates/': '/archive/classic-updates/getting-started/',
  '/distribution/release-channels/': '/archive/classic-updates/release-channels/',
  '/distribution/advanced-release-channels/': '/archive/classic-updates/advanced-release-channels/',
  '/distribution/optimizing-updates/': '/archive/classic-updates/optimizing-updates/',
  '/guides/offline-support/': '/archive/classic-updates/offline-support/',
  '/guides/preloading-and-caching-assets/':
    '/archive/classic-updates/preloading-and-caching-assets/',
  '/eas-update/bare-react-native/': '/eas-update/updating-your-app/',
  '/worfkflow/publishing/': '/archive/classic-updates/publishing/',
  '/classic/building-standalone-apps/': '/archive/classic-builds/building-standalone-apps/',
  '/classic/turtle-cli/': '/archive/classic-builds/turtle-cli/',
  '/archive/classic-updates/getting-started/': '/eas-update/getting-started/',

  // Redirects for removed API docs based on Sentry
  '/versions/latest/sdk/facebook/': '/guides/authentication/',
  '/versions/latest/sdk/taskmanager/': '/versions/latest/sdk/task-manager/',
  '/versions/latest/sdk/videothumbnails/': '/versions/latest/sdk/video-thumbnails/',
  '/versions/latest/sdk/appearance/': '/versions/latest/react-native/appearance/',
  '/versions/latest/sdk/app-loading/': '/versions/latest/sdk/splash-screen/',
  '/versions/latest/sdk/app-auth/': '/guides/authentication/',
  '/versions/latest/sdk/google-sign-in/': '/guides/authentication/',
  '/versions/latest/sdk/branch/':
    'https://github.com/expo/config-plugins/tree/main/packages/react-native-branch',
  '/versions/latest/sdk/appstate/': '/versions/latest/react-native/appstate/',
  '/versions/latest/sdk/google/': '/guides/authentication/',
  '/versions/latest/sdk/firebase-core/': '/guides/using-firebase/',
  '/versions/latest/sdk/firebase-analytics/': '/guides/using-firebase/',
  '/versions/latest/sdk/firebase-recaptcha/': '/guides/using-firebase/',
  '/versions/latest/sdk/amplitude/': '/guides/using-analytics/',
  '/versions/latest/sdk/util/': '/versions/latest/',
  '/versions/v45.0.0/sdk/google-sign-in': '/guides/google-authentication/',
  '/versions/v44.0.0/sdk/google/': '/guides/google-authentication/',
  '/versions/latest/sdk/error-recovery/': '/versions/latest/',
  '/guides/using-preact/': '/guides/overview/',
  '/versions/latest/sdk/shared-element/': '/versions/latest/',
  '/workflow/hermes/': '/guides/using-hermes/',
  '/config/app/': '/workflow/configuration/',
  '/versions/latest/sdk/settings/': '/versions/latest/',
  '/archive/expokit/eject/': '/archive/glossary/#eject',
  '/versions/latest/sdk/admob/': '/versions/latest/',
  '/versions/latest/sdk/payments/': '/versions/latest/sdk/stripe/',
  '/distribution/app-icons/': '/develop/user-interface/app-icons/',
  '/guides/using-libraries/': '/workflow/using-libraries/',
  '/tutorial/': '/tutorial/introduction/',

  // EAS Update
  '/eas-update/developing-with-eas-update/': '/eas-update/develop-faster/',
  '/eas-update/eas-update-with-local-build/': '/eas-update/build-locally/',
  '/eas-update/eas-update-and-eas-cli/': '/eas-update/eas-cli/',
  '/eas-update/debug-updates/': '/eas-update/debug/',
  '/eas-update/how-eas-update-works/': '/eas-update/how-it-works/',
  '/eas-update/migrate-to-eas-update/': '/eas-update/migrate-from-classic-updates/',
  '/distribution/custom-updates-server/': '/eas-update/custom-updates-server/',

  // Expo Router Advanced guides
  '/router/advance/root-layout': '/router/advanced/root-layout/',
  '/router/advance/stack': '/router/advanced/stack/',
  '/router/advance/tabs': '/router/advanced/tabs/',
  '/router/advance/drawer': '/router/advanced/drawer/',
  '/router/advance/nesting-navigators': '/router/advanced/nesting-navigators/',
  '/router/advance/modal': '/router/advanced/modals/',
  '/router/advance/platform-specific-modules': '/router/advanced/platform-specific-modules/',
  '/router/advance/shared-routes': '/router/advanced/shared-routes/',
  '/router/advance/router-settings': '/router/advanced/router-settings/',

  // Redirects as per Algolia 404 report
  '/workflow/build/building-on-ci': '/build/building-on-ci/',
  'versions/latest/sdk/filesystem.md': '/versions/latest/sdk/filesystem/',
  '/versions/v49.0.0/sdk/filesystem.md': '/versions/v49.0.0/sdk/filesystem/',
  '/versions/v48.0.0/sdk/filesystem.md': '/versions/v48.0.0/sdk/filesystem/',
  '/versions/v47.0.0/sdk/filesystem.md': '/versions/latest/sdk/filesystem/',
  '/versions/v46.0.0/sdk/filesystem.md': '/versions/latest/sdk/filesystem/',
  '/versions/v50.0.0/sdk/taskmanager': '/versions/v50.0.0/sdk/task-manager/',
  '/versions/v49.0.0/sdk/taskmanager': '/versions/v49.0.0/sdk/task-manager/',
  '/versions/v48.0.0/sdk/taskmanager': '/versions/v48.0.0/sdk/task-manager/',
  '/versions/v47.0.0/sdk/taskmanager': '/versions/v48.0.0/sdk/task-manager/',
  '/versions/v46.0.0/sdk/taskmanager': '/versions/latest/sdk/task-manager/',
  '/task-manager/': '/versions/latest/sdk/task-manager',
  'versions/v48.0.0/sdk': '/versions/latest',
  'versions/v48.0.0/sdk/config/app': '/versions/v48.0.0/sdk/config/app/',
  '/versions/v50.0.0/sdk': '/versions/v50.0.0',
  '/versions/v49.0.0/sdk': '/versions/v49.0.0',
  '/versions/v47.0.0/sdk': '/versions/latest',
  '/versions/v46.0.0/sdk': '/versions/latest',

  // Deprecated Webpack support
  '/guides/customizing-webpack': '/archive/customizing-webpack',
};
