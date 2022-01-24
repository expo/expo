// @preval

const frontmatter = require('front-matter');
const fs = require('fs');
const path = require('path');

const { LATEST_VERSION } = require('./versions');
const PAGES_DIR = path.resolve(__dirname, '../pages');

// TODO(cedric): refactor hidden and collapsed sections into properties of the groups

/** These directories will not be placed in the sidebar, but will still be searchable */
const hiddenSections = ['FAQ', 'Troubleshooting'];
/** These sections will NOT be expanded by default in the sidebar */
const collapsedSections = [
  'Deprecated',
  'Regulatory Compliance',
  'UI Programming',
  'Technical Specs',
];

// TODO(cedric): refactor docs to get rid of the directory lists

/** Manual list of directories to pull in to the getting started tutorial */
const startingDirectories = ['introduction', 'get-started', 'tutorial', 'next-steps'];
/** Manual list of directories to categorize as "EAS content" */
const easDirectories = ['eas', 'build', 'app-signing', 'build-reference', 'submit'];
/** Private preview section which isn't linked in the documentation */
const previewDirectories = ['preview'];
/** Public preview section which is linked under `Feature Preview` */
const featurePreviewDirectories = ['feature-preview', 'development', 'eas-update'];
/** All other unlisted directories */
const generalDirectories = fs
  .readdirSync(PAGES_DIR, { withFileTypes: true })
  .filter(entity => entity.isDirectory())
  .map(dir => dir.name)
  .filter(
    name =>
      name !== 'api' &&
      name !== 'versions' &&
      ![
        ...startingDirectories,
        ...previewDirectories,
        ...featurePreviewDirectories,
        ...easDirectories,
      ].includes(name)
  );
/** All versioned API directories */
const referenceDirectories = fs
  .readdirSync(path.resolve(PAGES_DIR, 'versions'), { withFileTypes: true })
  .filter(entity => entity.isDirectory())
  .map(dir => dir.name);

// --- Navigation ---

const starting = [
  makeSection('The Basics', [
    makeGroup('Get Started', [
      makePage('get-started/installation.md'),
      makePage('get-started/create-a-new-app.md'),
      makePage('get-started/errors.md'),
    ]),
    makeGroup('Tutorial', [
      makePage('tutorial/planning.md'),
      makePage('tutorial/text.md'),
      makePage('tutorial/image.md'),
      makePage('tutorial/button.md'),
      makePage('tutorial/image-picker.md'),
      makePage('tutorial/sharing.md'),
      makePage('tutorial/platform-differences.md'),
      makePage('tutorial/configuration.md'),
      makePage('tutorial/follow-up.md'),
    ]),
    makeGroup('Conceptual Overview', [
      makePage('introduction/managed-vs-bare.md'),
      makePage('introduction/walkthrough.md'),
      makePage('introduction/why-not-expo.md'),
      makePage('introduction/faq.md'),
    ]),
    makeGroup('Next Steps', [
      makePage('next-steps/using-the-documentation.md'),
      makePage('next-steps/community.md'),
      makePage('next-steps/additional-resources.md'),
    ]),
  ]),
];

const general = [
  makeSection('Fundamentals', [
    makeGroup('Fundamentals', [
      makePage('workflow/expo-cli.md'),
      makePage('workflow/using-libraries.md'),
      makePage('workflow/logging.md'),
      makePage('workflow/development-mode.md'),
      makePage('workflow/ios-simulator.md'),
      makePage('workflow/android-studio-emulator.md'),
      makePage('workflow/debugging.md'),
      makePage('workflow/configuration.md'),
      makePage('workflow/publishing.md'),
      makePage('workflow/upgrading-expo-sdk-walkthrough.md'),
      makePage('workflow/web.md'),
      makePage('workflow/snack.md'),
      makePage('workflow/customizing.md'),
      makePage('workflow/glossary-of-terms.md'),
      makePage('workflow/already-used-react-native.md'),
      makePage('workflow/common-development-errors.md'),
    ]),
  ]),
  makeSection('Distributing Your App', [
    makeGroup('Distributing Your App', [
      makePage('distribution/introduction.md'),
      makePage('distribution/app-stores.md'),
      makePage('distribution/release-channels.md'),
      makePage('distribution/advanced-release-channels.md'),
      makePage('distribution/runtime-versions.md'),
      makePage('distribution/hosting-your-app.md'),
      makePage('distribution/uploading-apps.md'),
      makePage('distribution/app-transfers.md'),
      makePage('distribution/security.md'),
      makePage('distribution/optimizing-updates.md'),
      makePage('distribution/publishing-websites.md'),
    ]),
  ]),
  makeSection('Assorted Guides', [
    makeGroup('Assorted Guides', [
      makePage('guides/assets.md'),
      makePage('guides/using-custom-fonts.md'),
      makePage('guides/icons.md'),
      makePage('guides/routing-and-navigation.md'),
      makePage('guides/permissions.md'),
      makePage('guides/app-icons.md'),
      makePage('guides/splash-screens.md'),
      makePage('guides/configuring-statusbar.md'),
      makePage('guides/color-schemes.md'),
      makePage('guides/typescript.md'),
      makePage('guides/authentication.md'),
      makePage('guides/userinterface.md'),
      makePage('guides/preloading-and-caching-assets.md'),
      makePage('guides/environment-variables.md'),
      makePage('guides/configuring-updates.md'),
      makePage('guides/customizing-metro.md'),
      makePage('guides/customizing-webpack.md'),
      makePage('guides/offline-support.md'),
      makePage('guides/progressive-web-apps.md'),
      makePage('guides/web-performance.md'),
      makePage('guides/delaying-code.md'),
      makePage('guides/errors.md'),
      makePage('guides/testing-with-jest.md'),
      makePage('guides/education.md'),
      makePage('guides/how-expo-works.md'),
      makePage('guides/linking.md'),
      makePage('guides/running-in-the-browser.md'),
      makePage('guides/setting-up-continuous-integration.md'),
      makePage('guides/testing-on-devices.md'),
      makePage('guides/troubleshooting-proxies.md'),
      makePage('guides/using-firebase.md'),
      makePage('guides/using-sentry.md'),
      makePage('guides/using-bugsnag.md'),
      makePage('guides/using-clojurescript.md'),
      makePage('guides/using-graphql.md'),
      makePage('guides/using-styled-components.md'),
      makePage('guides/config-plugins.md'),
      makePage('guides/monorepos.md'),
      makePage('guides/setup-native-firebase.md'),
      makePage('guides/sharing-preview-releases.md'),
      makePage('guides/using-electron.md'),
      makePage('guides/using-gatsby.md'),
      makePage('guides/using-hermes.md'),
      makePage('guides/using-nextjs.md'),
      makePage('guides/using-preact.md'),
    ]),
  ]),
  makeSection('Expo Modules', [
    makeGroup('Expo Modules', [
      makePage('modules/overview.md'),
      makePage('modules/module-api.md'),
      makePage('modules/android-lifecycle-listeners.md'),
      makePage('modules/appdelegate-subscribers.md'),
      makePage('modules/module-config.md'),
    ]),
  ]),
  makeSection('Expo Accounts', [
    makeGroup('Expo Accounts', [
      makePage('accounts/account-types.md'),
      makePage('accounts/two-factor.md'),
      makePage('accounts/programmatic-access.md'),
      makePage('accounts/working-together.md'),
    ]),
  ]),
  makeSection('Bare Workflow', [
    makeGroup('Bare Workflow', [
      makePage('bare/exploring-bare-workflow.md'),
      makePage('bare/hello-world.md'),
      makePage('bare/using-libraries.md'),
      makePage('bare/existing-apps.md'),
      makePage('bare/installing-expo-modules.md'),
      makePage('bare/installing-unimodules.md'),
      makePage('bare/installing-updates.md'),
      makePage('bare/unimodules-full-list.md'),
      makePage('bare/using-expo-client.md'),
      makePage('bare/using-web.md'),
      makePage('bare/migrating-from-expokit.md'),
      makePage('bare/updating-your-app.md'),
      makePage('bare/error-recovery.md'),
    ]),
  ]),
  makeSection('Push Notifications', [
    makeGroup('Push Notifications', [
      makePage('push-notifications/overview.md'),
      makePage('push-notifications/push-notifications-setup.md'),
      makePage('push-notifications/sending-notifications.md'),
      makePage('push-notifications/sending-notifications-custom.md'),
      makePage('push-notifications/receiving-notifications.md'),
      makePage('push-notifications/using-fcm.md'),
      makePage('push-notifications/faq.md'),
    ]),
  ]),
  makeSection('Classic Services', [
    makeGroup('Classic Services', sortAlphabetical(pagesFromDir('classic'))),
  ]),
  makeSection('UI Programming', [
    makeGroup('UI Programming', [
      makePage('ui-programming/image-background.md'),
      makePage('ui-programming/implementing-a-checkbox.md'),
      makePage('ui-programming/z-index.md'),
      makePage('ui-programming/using-svgs.md'),
      makePage('ui-programming/react-native-toast.md'),
      makePage('ui-programming/react-native-styling-buttons.md'),
    ]),
  ]),
  makeSection('Regulatory Compliance', [
    makeGroup('Regulatory Compliance', sortAlphabetical(pagesFromDir('regulatory-compliance'))),
  ]),
  makeSection('Technical Specs', [
    makeGroup('Technical Specs', [
      makePage('technical-specs/expo-updates-0.md'),
      makePage('technical-specs/expo-sfv-0.md'),
    ]),
  ]),
  makeSection('Deprecated', [
    makeGroup('ExpoKit', [
      makePage('expokit/overview.md'),
      makePage('expokit/eject.md'),
      makePage('expokit/expokit.md'),
      makePage('expokit/advanced-expokit-topics.md'),
      makePage('expokit/universal-modules-and-expokit.md'),
    ]),
    makeGroup('Archived', sortAlphabetical(pagesFromDir('archived'))),
  ]),
  // TODO(cedric): this group isn't visible in the current sidebar, check if we need to fix or remove it
  makeGroup('Troubleshooting', pagesFromDir('troubleshooting')),
];

const eas = [
  makeSection('EAS', [makeGroup('EAS', [makePage('eas/webhooks.md')], './pages/eas/')]),
  makeSection('EAS Build', [
    makeGroup(
      'Start Building',
      [
        makePage('build/introduction.md'),
        makePage('build/setup.md'),
        makePage('build/eas-json.md'),
        makePage('build/internal-distribution.md'),
        makePage('build/automating-submissions.md'),
        makePage('build/updates.md'),
        makePage('build/building-on-ci.md'),
      ],
      './pages/build/'
    ),
    makeGroup('App Signing', [
      makePage('app-signing/app-credentials.md'),
      makePage('app-signing/managed-credentials.md'),
      makePage('app-signing/local-credentials.md'),
      makePage('app-signing/existing-credentials.md'),
      makePage('app-signing/syncing-credentials.md'),
    ]),
    makeGroup('Reference', [
      makePage('build-reference/eas-json.md'),
      makePage('build-reference/migrating.md'),
      makePage('build-reference/how-tos.md'),
      makePage('build-reference/private-npm-packages.md'),
      makePage('build-reference/variables.md'),
      makePage('build-reference/apk.md'),
      makePage('build-reference/simulators.md'),
      makePage('build-reference/troubleshooting.md'),
      makePage('build-reference/local-builds.md'),
      makePage('build-reference/variants.md'),
      makePage('build-reference/caching.md'),
      makePage('build-reference/android-builds.md'),
      makePage('build-reference/ios-builds.md'),
      makePage('build-reference/limitations.md'),
      makePage('build-reference/build-configuration.md'),
      makePage('build-reference/infrastructure.md'),
      makePage('build-reference/ios-capabilities.md'),
    ]),
  ]),
  makeSection('EAS Submit', [
    makeGroup('EAS Submit', [
      makePage('submit/introduction.md'),
      makePage('submit/eas-json.md'),
      makePage('submit/android.md'),
      makePage('submit/ios.md'),
      makePage('submit/classic-builds.md'),
    ]),
  ]),
];

const preview = [
  makeSection('Preview', [
    makeGroup('Preview', [makePage('preview/introduction.md'), makePage('preview/support.md')]),
  ]),
];

const featurePreview = [
  makeGroup('Feature Preview', [], './pages/feature-preview/'),
  makeSection('Development Builds', [
    makeGroup('Development Builds', [
      makePage('development/introduction.md'),
      makePage('development/getting-started.md'),
      makePage('development/build.md'),
      makePage('development/installation.md'),
      makePage('development/development-workflows.md'),
      makePage('development/extending-the-dev-menu.md'),
      makePage('development/compatibility.md'),
      makePage('development/upgrading.md'),
      makePage('development/troubleshooting.md'),
    ]),
  ]),
  makeSection('EAS Update', [
    makeGroup('EAS Update', [
      makePage('eas-update/introduction.md'),
      makePage('eas-update/getting-started.md'),
      makePage('eas-update/github-actions.md'),
      makePage('eas-update/how-eas-update-works.md'),
      makePage('eas-update/deployment-patterns.md'),
      makePage('eas-update/debug-updates.md'),
      makePage('eas-update/eas-update-and-eas-cli.md'),
      makePage('eas-update/optimize-assets.md'),
      makePage('eas-update/custom-updates-server.md'),
      makePage('eas-update/migrate-to-eas-update.md'),
      makePage('eas-update/bare-react-native.md'),
      makePage('eas-update/runtime-versions.md'),
      makePage('eas-update/environment-variables.md'),
      makePage('eas-update/expo-dev-client.md'),
      makePage('eas-update/known-issues.md'),
      makePage('eas-update/faq.md'),
    ]),
  ]),
];

const reference = referenceDirectories.reduce(
  (all, version) => ({
    ...all,
    [version]: [
      makeSection('Configuration Files', [
        makeGroup('Configuration Files', pagesFromDir(`versions/${version}/config`)),
      ]),
      makeSection('Expo SDK', [makeGroup('Expo SDK', pagesFromDir(`versions/${version}/sdk`))]),
      makeSection('React Native', [
        makeGroup(
          'React Native',
          sortLegacyReactNative(pagesFromDir(`versions/${version}/react-native`))
        ),
      ]),
    ],
  }),
  {}
);

module.exports = {
  starting,
  general,
  eas,
  preview,
  featurePreview,
  /** @type {any} */
  reference: { ...reference, latest: reference[LATEST_VERSION] },
  generalDirectories,
  startingDirectories,
  previewDirectories,
  easDirectories,
  featurePreviewDirectories,
  hiddenSections,
  collapsedSections,
};

// --- MDX methods ---

function makeSection(name, children = []) {
  // TODO(cedric): refactor node types to match unist
  return { name, children };
}

function makeGroup(name, children = [], href = '') {
  // TODO(cedric): refactor node types to match unist
  return { name, href, posts: children };
}

/**
 * Parse the MDX page and extract the frontmatter/yaml page information.
 * It will only look for the frontmatter/yaml block in the root nodes.
 * This requires the `remark-frontmatter` MDX plugin.
 *
 * @param {string} file
 */
function makePage(file) {
  const filePath = !path.isAbsolute(file) ? path.resolve(PAGES_DIR, file) : file;
  const contents = fs.readFileSync(filePath, 'utf-8');
  const url = pageUrl(filePath);
  const data = frontmatter(contents).attributes;

  if (!data) {
    console.error('Page YAML block is unreadable:', file);
  } else if (!data.title) {
    console.error('Page does not have a `title`:', file);
    data.title = '';
  }

  const result = {
    // TODO(cedric): refactor name into title
    name: data.title,
    // TODO(cedric): refactor href into url
    href: url,
  };
  // TODO(cedric): refactor sidebarTitle into metadata
  if (data.sidebar_title) {
    result.sidebarTitle = data.sidebar_title;
  }
  // TODO(cedric): refactor sidebarTitle into metadata
  if (data.hidden) {
    result.hidden = data.hidden;
  }
  return result;
}

// --- Other helpers ---

/**
 * Load all pages from a single directory.
 */
function pagesFromDir(dir) {
  return fs
    .readdirSync(path.resolve(PAGES_DIR, dir), { withFileTypes: true })
    .filter(entity => entity.isFile())
    .map(file => makePage(path.join(dir, file.name)));
}

/**
 * Create the page url using the absolute file path.
 */
function pageUrl(file) {
  return path
    .relative(path.resolve(PAGES_DIR, '../'), file)
    .replace(path.extname(file), '')
    .replace(/\\/g, '/');
}

/**
 * Sort the list of pages alphabetically by either the sidebarTitle or title.
 */
function sortAlphabetical(pages) {
  return pages.sort((a, b) => {
    const aTitle = a.sidebarTitle || a.name;
    const bTitle = b.sidebarTitle || b.name;
    return aTitle.localeCompare(bTitle);
  });
}

/**
 * Sort the list of React Native pages by legacy custom sorting.
 */
function sortLegacyReactNative(pages) {
  const order = [
    'Learn the Basics',
    'Props',
    'State',
    'Style',
    'Height and Width',
    'Layout with Flexbox',
    'Handling Text Input',
    'Handling Touches',
    'Using a ScrollView',
    'Using List Views',
    'Networking',
    'Platform Specific Code',
    'Navigating Between Screens',
    'Images',
    'Animations',
    'Accessibility',
    'Timers',
    'Performance',
    'Gesture Responder System',
    'JavaScript Environment',
    'Direct Manipulation',
    'Color Reference',
    'ActivityIndicator',
    'Button',
    'DatePickerIOS',
    'DrawerLayoutAndroid',
    'FlatList',
    'Image',
    'InputAccessoryView',
    'KeyboardAvoidingView',
    'ListView',
    'MaskedViewIOS',
    'Modal',
    'NavigatorIOS',
    'Picker',
    'PickerIOS',
    'ProgressBarAndroid',
    'ProgressViewIOS',
    'RefreshControl',
    'SafeAreaView',
    'ScrollView',
    'SectionList',
    'SegmentedControl',
    'SegmentedControlIOS',
    'Slider',
    'SnapshotViewIOS',
    'StatusBar',
    'Switch',
    'TabBarIOS.Item',
    'TabBarIOS',
    'Text',
    'TextInput',
    'ToolbarAndroid',
    'TouchableHighlight',
    'TouchableNativeFeedback',
    'TouchableOpacity',
    'TouchableWithoutFeedback',
    'View',
    'ViewPagerAndroid',
    'VirtualizedList',
    'WebView',
    'AccessibilityInfo',
    'ActionSheetIOS',
    'Alert',
    'AlertIOS',
    'Animated',
    'AppState',
    'AsyncStorage',
    'BackAndroid',
    'BackHandler',
    'Clipboard',
    'DatePickerAndroid',
    'Dimensions',
    'Easing',
    'Image Style Props',
    'ImageStore',
    'InteractionManager',
    'Keyboard',
    'Layout Props',
    'LayoutAnimation',
    'ListViewDataSource',
    'NetInfo',
    'PanResponder',
    'PixelRatio',
    'Settings',
    'Shadow Props',
    'Share',
    'StatusBarIOS',
    'StyleSheet',
    'Systrace',
    'Text Style Props',
    'TimePickerAndroid',
    'ToastAndroid',
    'Transforms',
    'Vibration',
    'VibrationIOS',
    'View Style Props',
  ];

  return pages.sort((a, b) => {
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    return aIndex < 0 || bIndex < 0 ? bIndex - aIndex : aIndex - bIndex;
  });
}
