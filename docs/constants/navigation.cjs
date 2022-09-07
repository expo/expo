// @preval

const frontmatter = require('front-matter');
const fs = require('fs');
const path = require('path');
const make = require('unist-builder');
const { URL } = require('url');

const { LATEST_VERSION, VERSIONS } = require('./versions.cjs');
const PAGES_DIR = path.resolve(__dirname, '../pages');

// TODO(cedric): refactor docs to get rid of the directory lists

/** Manual list of directories to categorize as "EAS content" */
const easDirectories = [
  'eas',
  'build',
  'app-signing',
  'build-reference',
  'submit',
  'eas-update',
  'eas-metadata',
];
/** Manual list of directories to categorize as "Archive" */
const archiveDirectories = ['archive'];
/** Private preview section which isn't linked in the documentation */
const previewDirectories = ['preview'];
/** All other unlisted directories */
const generalDirectories = fs
  .readdirSync(PAGES_DIR, { withFileTypes: true })
  .filter(entity => entity.isDirectory())
  .map(dir => dir.name)
  .filter(
    name =>
      name !== 'api' &&
      name !== 'versions' &&
      ![...previewDirectories, ...easDirectories, ...archiveDirectories].includes(name)
  );

// --- Navigation ---

const general = [
  makeSection(
    'Get Started',
    [
      makePage('get-started/installation.md'),
      makePage('get-started/create-a-new-app.md'),
      makePage('get-started/errors.md'),
    ],
    { expanded: true }
  ),
  makeSection(
    'Tutorial',
    [
      makePage('tutorial/planning.md'),
      makePage('tutorial/text.md'),
      makePage('tutorial/image.md'),
      makePage('tutorial/button.md'),
      makePage('tutorial/image-picker.md'),
      makePage('tutorial/sharing.md'),
      // makePage('tutorial/platform-differences.md'),
      makePage('tutorial/configuration.md'),
      makePage('tutorial/follow-up.md'),
    ],
    { expanded: true }
  ),
  makeSection(
    'Conceptual Overview',
    [
      makePage('introduction/managed-vs-bare.md'),
      // makePage('introduction/walkthrough.md'),
      makePage('introduction/why-not-expo.md'),
      makePage('introduction/faq.md'),
    ],
    { expanded: true }
  ),
  makeSection(
    'Next Steps',
    [makePage('next-steps/community.md'), makePage('next-steps/additional-resources.md')],
    { expanded: true }
  ),
  makeSection('Fundamentals', [
    makePage('workflow/expo-cli.md'),
    makePage('workflow/using-libraries.md'),
    makePage('workflow/logging.md'),
    makePage('workflow/development-mode.md'),
    makePage('workflow/ios-simulator.md'),
    makePage('workflow/android-studio-emulator.md'),
    makePage('workflow/run-on-device.md'),
    makePage('workflow/debugging.md'),
    makePage('workflow/configuration.md'),
    makePage('workflow/upgrading-expo-sdk-walkthrough.md'),
    makePage('workflow/web.md'),
    makePage('workflow/snack.md'),
    makePage('workflow/customizing.md'),
    makePage('workflow/glossary-of-terms.md'),
    makePage('workflow/already-used-react-native.md'),
    makePage('workflow/common-development-errors.md'),
  ]),
  makeSection('Distributing Your App', [
    makePage('distribution/introduction.md'),
    makePage('distribution/app-stores.md'),
    makePage('distribution/runtime-versions.md'),
    makePage('distribution/custom-updates-server.md'),
    makePage('distribution/app-transfers.md'),
    makePage('distribution/publishing-websites.md'),
  ]),
  makeSection('Development Builds', [
    makePage('development/introduction.md'),
    makePage('development/getting-started.md'),
    makePage('development/build.md'),
    makePage('development/installation.md'),
    makePage('development/development-workflows.md'),
    makePage('development/extensions.md'),
    makePage('development/compatibility.md'),
    makePage('development/upgrading.md'),
    makePage('development/troubleshooting.md'),
  ]),
  makeSection('Integrations', [
    makePage('guides/using-firebase.md'),
    makePage('guides/setup-native-firebase.md'),
    makePage('guides/using-sentry.md'),
    makePage('guides/using-bugsnag.md'),
    makePage('guides/using-clojurescript.md'),
    makePage('guides/using-graphql.md'),
    makePage('guides/using-styled-components.md'),
    makePage('guides/using-electron.md'),
    makePage('guides/using-nextjs.md'),
    makePage('guides/using-preact.md'),
    makePage('guides/typescript.md'),
  ]),
  makeSection('Assorted Guides', [
    makePage('guides/routing-and-navigation.md'),
    makePage('guides/permissions.md'),
    makePage('guides/authentication.md'),
    makePage('guides/environment-variables.md'),
    makePage('guides/customizing-metro.md'),
    makePage('guides/customizing-webpack.md'),
    makePage('guides/progressive-web-apps.md'),
    makePage('guides/web-performance.md'),
    makePage('guides/delaying-code.md'),
    makePage('guides/errors.md'),
    makePage('guides/testing-with-jest.md'),
    makePage('guides/education.md'),
    makePage('guides/how-expo-works.md'),
    makePage('guides/linking.md'),
    makePage('guides/deep-linking.md'),
    makePage('guides/setting-up-continuous-integration.md'),
    makePage('guides/troubleshooting-proxies.md'),
    makePage('guides/config-plugins.md'),
    makePage('guides/monorepos.md'),
    makePage('guides/sharing-preview-releases.md'),
    makePage('guides/using-hermes.md'),
    makePage('guides/adopting-prebuild.md'),
  ]),
  makeSection('Expo Module API (Alpha)', [
    makePage('modules/overview.md'),
    makePage('modules/module-api.md'),
    makePage('modules/android-lifecycle-listeners.md'),
    makePage('modules/appdelegate-subscribers.md'),
    makePage('modules/module-config.md'),
  ]),
  makeSection('Expo Accounts', [
    makePage('accounts/account-types.md'),
    makePage('accounts/two-factor.md'),
    makePage('accounts/programmatic-access.md'),
    makePage('accounts/working-together.md'),
  ]),
  makeSection('Bare Workflow', [
    makePage('bare/hello-world.md'),
    makePage('bare/installing-expo-modules.md'),
    makePage('bare/installing-updates.md'),
    makePage('bare/using-expo-client.md'),
    makePage('bare/updating-your-app.md'),
    makePage('bare/error-recovery.md'),
  ]),
  makeSection('Push Notifications', [
    makePage('push-notifications/overview.md'),
    makePage('push-notifications/push-notifications-setup.md'),
    makePage('push-notifications/sending-notifications.md'),
    makePage('push-notifications/sending-notifications-custom.md'),
    makePage('push-notifications/receiving-notifications.md'),
    makePage('push-notifications/using-fcm.md'),
    makePage('push-notifications/faq.md'),
  ]),
  makeSection('UI Programming', [
    makePage('guides/assets.md'),
    makePage('guides/icons.md'),
    makePage('guides/app-icons.md'),
    makePage('guides/splash-screens.md'),
    makePage('guides/configuring-statusbar.md'),
    makePage('guides/color-schemes.md'),
    makePage('guides/using-custom-fonts.md'),
    makePage('ui-programming/image-background.md'),
    makePage('ui-programming/implementing-a-checkbox.md'),
    makePage('ui-programming/z-index.md'),
    makePage('ui-programming/using-svgs.md'),
    makePage('ui-programming/react-native-toast.md'),
    makePage('ui-programming/react-native-styling-buttons.md'),
    makePage('guides/userinterface.md'),
  ]),
  makeSection('Regulatory Compliance', sortAlphabetical(pagesFromDir('regulatory-compliance')), {}),
  makeSection('Technical Specs', [
    makePage('technical-specs/expo-updates-0.md'),
    makePage('technical-specs/expo-sfv-0.md'),
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
];

const eas = [
  makeSection('EAS', [makePage('eas/index.md'), makePage('eas/webhooks.md')], { expanded: true }),
  makeSection(
    'EAS Build',
    [
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
        makePage('app-signing/security.md'),
      ]),
      makeGroup('Reference', [
        makePage('build-reference/eas-json.md'),
        makePage('build-reference/migrating.md'),
        makePage('build-reference/npm-hooks.md'),
        makePage('build-reference/how-tos.md'),
        makePage('build-reference/private-npm-packages.md'),
        makePage('build-reference/variables.md'),
        makePage('build-reference/apk.md'),
        makePage('build-reference/simulators.md'),
        makePage('build-reference/app-versions.md'),
        makePage('build-reference/troubleshooting.md'),
        makePage('build-reference/variants.md'),
        makePage('build-reference/ios-capabilities.md'),
        makePage('build-reference/local-builds.md'),
        makePage('build-reference/caching.md'),
        makePage('build-reference/android-builds.md'),
        makePage('build-reference/ios-builds.md'),
        makePage('build-reference/build-configuration.md'),
        makePage('build-reference/infrastructure.md'),
        makePage('build-reference/app-extensions.md'),
        makePage('build-reference/e2e-tests.md'),
        makePage('build-reference/limitations.md'),
      ]),
    ],
    { expanded: true }
  ),
  makeSection(
    'EAS Submit',
    [
      makePage('submit/introduction.md'),
      makePage('submit/eas-json.md'),
      makePage('submit/android.md'),
      makePage('submit/ios.md'),
      makePage('submit/classic-builds.md'),
    ],
    { expanded: true }
  ),
  makeSection(
    'EAS Update',
    [
      makeGroup('EAS Update', [
        makePage('eas-update/introduction.md'),
        makePage('eas-update/getting-started.md'),
        makePage('eas-update/github-actions.md'),
        makePage('eas-update/developing-with-eas-update.md'),
        makePage('eas-update/how-eas-update-works.md'),
        makePage('eas-update/deployment-patterns.md'),
        makePage('eas-update/debug-updates.md'),
        makePage('eas-update/eas-update-and-eas-cli.md'),
        makePage('eas-update/optimize-assets.md'),
        makePage('eas-update/migrate-to-eas-update.md'),
        makePage('eas-update/runtime-versions.md'),
        makePage('eas-update/environment-variables.md'),
        makePage('eas-update/expo-dev-client.md'),
        makePage('eas-update/known-issues.md'),
        makePage('eas-update/faq.md'),
      ]),
    ],
    { expanded: true }
  ),
];

const preview = [
  makeSection('Preview', [
    makePage('preview/introduction.md'),
    makePage('preview/support.md'),
    { expanded: true },
  ]),
];

const archive = [
  makeSection('Archive', [makeGroup('Archive', [makePage('archive/index.md')])], {
    expanded: true,
  }),
  makeSection(
    'Classic Updates',
    [
      makeGroup('Classic Updates', [makePage('archive/classic-updates/introduction.md')]),
      makeGroup('Guides', [
        makePage('archive/classic-updates/configuring-updates.md'),
        makePage('archive/classic-updates/preloading-and-caching-assets.md'),
      ]),
      makeGroup('Distribution', [
        makePage('archive/classic-updates/release-channels.md'),
        makePage('archive/classic-updates/advanced-release-channels.md'),
        makePage('archive/classic-updates/hosting-your-app.md'),
        makePage('archive/classic-updates/offline-support.md'),
        makePage('archive/classic-updates/optimizing-updates.md'),
      ]),
      makeGroup('Workflow', [makePage('archive/classic-updates/publishing.md')]),
      makeGroup('Bare Workflow', [makePage('archive/classic-updates/updating-your-app.md')]),
      makeGroup('Classic Services', [
        makePage('archive/classic-updates/building-standalone-apps.md'),
        makePage('archive/classic-updates/turtle-cli.md'),
      ]),
    ],
    {
      expanded: true,
    }
  ),
  makeSection(
    'EAS Metadata',
    [
      makePage('eas-metadata/introduction.md'),
      makePage('eas-metadata/getting-started.md'),
      // makePage('eas-metadata/store-json.md'), Disabled due to missing config overview
    ],
    { expanded: true }
  ),
];

const featurePreview = [];

const versionsReference = VERSIONS.reduce(
  (all, version) => ({
    ...all,
    [version]: [
      makeSection('Configuration Files', pagesFromDir(`versions/${version}/config`)),
      makeSection('Expo SDK', pagesFromDir(`versions/${version}/sdk`)),
      makeSection('React Native', sortLegacyReactNative(version), { expanded: true }),
    ],
  }),
  {}
);

const reference = { ...versionsReference, latest: versionsReference[LATEST_VERSION] };

module.exports = {
  general,
  eas,
  preview,
  archive,
  featurePreview,
  /** @type {any} */
  reference,
  generalDirectories,
  previewDirectories,
  easDirectories,
};

// --- MDX methods ---

function makeSection(name, children = [], props = {}) {
  return make('section', { name, ...{ expanded: false, ...props } }, children);
}

function makeGroup(name, children = [], props = {}) {
  return make('group', { name, ...props }, children);
}

/**
 * Parse the MDX page and extract the frontmatter/yaml page information.
 * It will only look for the frontmatter/yaml block in the root nodes.
 * This requires the `remark-frontmatter` MDX plugin.
 *
 * @param {string} file
 */
function makePage(file) {
  const filePath = path.resolve(PAGES_DIR, file);
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
  // TODO(cedric): refactor hidden into `isHidden` and move it to metadata
  if (data.hidden) {
    result.hidden = data.hidden;
  }
  return make('page', result);
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
 * This parses the URL, relatively from PAGES_DIR.
 * It also strips the file extension, and name if its `index`.
 * These urls are pathnames, without trailing slashes.
 */
function pageUrl(file) {
  const filePath = path.parse(file);
  const { pathname } = new URL(path.relative(PAGES_DIR, file), 'https://docs.expo.dev');
  return pathname
    .replace(filePath.base, filePath.name === 'index' ? '' : filePath.name)
    .replace(/\/$/, '');
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
function sortLegacyReactNative(version) {
  const pages = pagesFromDir(`versions/${version}/react-native`);

  const components = [
    'ActivityIndicator',
    'Button',
    'DatePickerIOS',
    'DrawerLayoutAndroid',
    'FlatList',
    'Image',
    'ImageBackground',
    'InputAccessoryView',
    'KeyboardAvoidingView',
    'ListView',
    'MaskedViewIOS',
    'Modal',
    'NavigatorIOS',
    'Picker',
    'PickerIOS',
    'Pressable',
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
  ];

  const apis = [
    'AccessibilityInfo',
    'ActionSheetIOS',
    'Alert',
    'AlertIOS',
    'Animated',
    'Animated.Value',
    'Animated.ValueXY',
    'Appearance',
    'AppState',
    'AsyncStorage',
    'BackAndroid',
    'BackHandler',
    'Clipboard',
    'DatePickerAndroid',
    'Dimensions',
    'DynamicColorIOS',
    'Easing',
    'ImageStore',
    'InteractionManager',
    'Keyboard',
    'LayoutAnimation',
    'ListViewDataSource',
    'NetInfo',
    'PanResponder',
    'PixelRatio',
    'Platform',
    'PlatformColor',
    'Settings',
    'Share',
    'StatusBarIOS',
    'StyleSheet',
    'Systrace',
    'TimePickerAndroid',
    'ToastAndroid',
    'Transforms',
    'Vibration',
    'VibrationIOS',
  ];

  const hooks = ['useColorScheme', 'useWindowDimensions'];

  const props = [
    'Image Style Props',
    'Layout Props',
    'Shadow Props',
    'Text Style Props',
    'View Style Props',
  ];

  const types = [
    'LayoutEvent Object Type',
    'PressEvent Object Type',
    'React Node Object Type',
    'Rect Object Type',
    'ViewToken Object Type',
  ];

  return [
    makeGroup(
      'Components',
      pages.filter(page => components.includes(page.name))
    ),
    makeGroup(
      'Props',
      pages.filter(page => props.includes(page.name))
    ),
    makeGroup(
      'APIs',
      pages.filter(page => apis.includes(page.name))
    ),
    makeGroup(
      'Hooks',
      pages.filter(page => hooks.includes(page.name))
    ),
    makeGroup(
      'Types',
      pages.filter(page => types.includes(page.name))
    ),
  ];
}
