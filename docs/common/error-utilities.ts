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
  '/introduction/project-lifecycle/': '/introduction/managed-vs-bare/',
  '/guides/': '/workflow/exploring-managed-workflow/',
  '/versions/latest/sdk/': '/versions/latest/',
  '/versions/latest/sdk/overview/': '/versions/latest/',
  '/guides/building-standalone-apps/': '/archive/classic-updates/building-standalone-apps/',
  '/distribution/building-standalone-apps/': '/archive/classic-updates/building-standalone-apps/',
  '/guides/genymotion/': '/workflow/android-studio-emulator/',
  '/workflow/upgrading-expo/': '/workflow/upgrading-expo-sdk-walkthrough/',
  '/workflow/create-react-native-app/': '/workflow/glossary-of-terms/#create-react-native-app',
  '/expokit/': '/archive/glossary/#expokit/',

  // Development builds redirects
  '/development/build/': '/development/create-development-builds/',
  '/development/getting-started/': '/development/create-development-builds/',
  '/development/troubleshooting/': '/development/introduction/',
  '/development/upgrading/': '/development/introduction/',
  '/development/extensions/': '/development/development-workflows/',
  '/development/develop-your-project': '/development/use-development-builds',

  // Consolidate workflow page
  '/bare/customizing/': '/workflow/customizing/',

  // Lots of old links pointing to guides when they have moved elsewhere
  '/guides/configuration/': '/workflow/configuration/',
  '/guides/expokit/': '/archive/glossary/#expokit/',
  '/guides/publishing/': '/archive/classic-updates/publishing/',
  '/workflow/publishing/': '/archive/classic-updates/publishing/',
  '/guides/linking/': '/workflow/linking/',
  '/guides/up-and-running/': '/get-started/installation/',
  '/guides/debugging/': '/workflow/debugging/',
  '/guides/logging/': '/workflow/logging/',
  '/introduction/troubleshooting-proxies/': '/guides/troubleshooting-proxies/',
  '/introduction/running-in-the-browser/': '/guides/running-in-the-browser/',
  '/guides/using-electron/':
    'https://dev.to/evanbacon/making-desktop-apps-with-electron-react-native-and-expo-5e36',

  // Changes from redoing the getting started workflow, SDK35+
  '/workflow/up-and-running/': '/get-started/installation/',
  '/introduction/additional-resources/': '/next-steps/additional-resources/',
  '/introduction/already-used-react-native/': '/workflow/already-used-react-native/',
  '/introduction/community/': '/next-steps/community/',
  '/introduction/installation/': '/get-started/installation/',
  '/versions/latest/overview/': '/versions/latest/',
  '/versions/latest/introduction/installation/': '/get-started/installation/',
  '/workflow/exploring-managed-workflow/': '/tutorial/introduction/',
  '/introduction/walkthrough/': '/tutorial/introduction/',

  // Move overview to index
  '/versions/v37.0.0/sdk/overview/': '/versions/v37.0.0/',

  // Errors and debugging is better suited for getting started than tutorial
  '/tutorial/errors/': '/get-started/errors/',

  // Redirects based on Next 9 upgrade (09/11/2020)
  '/api/': '/versions/latest/',

  // Redirect to expand Expo Accounts and permissions
  '/guides/account-permissions/': '/accounts/personal/',

  // Redirects based on Sentry reports
  '/next-steps/installation/': '/get-started/installation/',
  '/guides/release-channels/': '/archive/classic-updates/release-channels/',
  '/guides/push-notifications/': '/push-notifications/overview/',
  '/guides/using-fcm/': '/push-notifications/using-fcm/',
  '/push-notifications/': '/push-notifications/overview/',
  '/distribution/hosting-your-app/': '/distribution/publishing-websites/',
  '/build-reference/how-tos/': '/build-reference/private-npm-packages/',
  '/get-started/': '/get-started/installation/',
  '/guides/detach/': '/archive/glossary/#detach',

  // Renaming a submit section
  '/submit/submit-ios': '/submit/ios/',
  '/submit/submit-android': '/submit/android/',

  // Fundamentals had too many things
  '/workflow/linking/': '/guides/linking/',
  '/workflow/how-expo-works/': '/workflow/already-used-react-native/#how-does-expo-work',
  '/guides/how-expo-works/': '/workflow/already-used-react-native/#how-does-expo-work',

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
  '/introduction/why-not-expo/': '/introduction/faq/#limitations',

  // Permissions API is moved to guide
  '/versions/v40.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v41.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v42.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/v43.0.0/sdk/permissions/': '/guides/permissions/',
  '/versions/latest/sdk/permissions/': '/guides/permissions/',

  // Redirect Gatsby guide to index guides page
  '/guides/using-gatsby/': '/guides/',

  // Classic updates moved to archive
  '/guides/configuring-ota-updates/': '/archive/classic-updates/getting-started/',
  '/guides/configuring-updates/': '/archive/classic-updates/getting-started/',
  '/distribution/release-channels/': '/archive/classic-updates/release-channels/',
  '/distribution/advanced-release-channels/': '/archive/classic-updates/advanced-release-channels/',
  '/distribution/optimizing-updates/': '/archive/classic-updates/optimizing-updates/',
  '/eas-update/custom-updates-server/': '/distribution/custom-updates-server/',
  '/guides/offline-support/': '/archive/classic-updates/offline-support/',
  '/guides/preloading-and-caching-assets/':
    '/archive/classic-updates/preloading-and-caching-assets/',
  '/eas-update/bare-react-native/': '/bare/updating-your-app/',
  '/worfkflow/publishing/': '/archive/classic-updates/publishing/',
  '/classic/building-standalone-apps/': '/archive/classic-updates/building-standalone-apps/',
  '/classic/turtle-cli/': '/archive/classic-updates/turtle-cli/',
  '/archive/classic-updates/getting-started/': '/eas-update/getting-started/',

  // Redirect bare guides to unified workflow guides
  '/bare/using-libraries/': '/workflow/using-libraries/',
  '/bare/exploring-bare-workflow/': '/bare/hello-world/',
  '/bare/existing-apps/': '/bare/installing-expo-modules/',
  '/bare/installing-unimodules/': '/bare/installing-expo-modules/',
  '/bare/using-web/': '/workflow/web/',
  '/guides/running-in-the-browser/': '/workflow/web/',
  '/bare/unimodules-full-list/': '/bare/hello-world/',

  // Consolidate distribution
  '/distribution/security/': '/app-signing/security/',
  '/distribution/uploading-apps/': '/submit/introduction/',
  '/versions/latest/distribution/uploading-apps/': '/submit/introduction/',

  // Deleted or removed guides
  '/guides/setup-native-firebase/': '/guides/using-firebase/',
  '/guides/using-clojurescript/': '/',

  // Redirects from old to new tutorial
  '/tutorial/planning/': '/tutorial/introduction/',
  '/tutorial/sharing/': '/tutorial/introduction/',
  '/tutorial/text/': '/tutorial/introduction/',

  // Redirects for removed /archived pages
  '/archived/': '/archive/',
  '/versions/latest/expokit/eject/': '/archive/glossary/#eject',
  '/expokit/eject/': '/archive/glossary/#eject',
  '/expokit/expokit/': '/archive/glossary/#expokit',
  '/submit/classic-builds/': '/submit/introduction/',

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
  // Push notifications
  '/push-notifications/using-fcm/': '/push-notifications/push-notifications-setup',
  '/config/app/': '/workflow/configuration/',
};
