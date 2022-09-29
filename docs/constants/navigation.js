import frontmatter from 'front-matter';
import fs from 'fs';
import path from 'path';
import { u as make } from 'unist-builder';
import { URL, fileURLToPath } from 'url';

import { LATEST_VERSION, VERSIONS } from './versions.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(dirname, '../pages');

// TODO(cedric): refactor docs to get rid of the directory lists

/** Manual list of directories to categorize as "EAS content" */
const easDirectories = ['eas', 'build', 'app-signing', 'build-reference', 'submit', 'eas-update'];
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
    'Get started',
    [
      makeGroup('Set up', [
        makePage('get-started/installation.mdx'),
        makePage('get-started/create-a-new-app.mdx'),
        makePage('get-started/errors.mdx'),
      ]),
      makeGroup(
        'Tutorial',
        [
          makePage('tutorial/planning.mdx'),
          makePage('tutorial/text.mdx'),
          makePage('tutorial/image.mdx'),
          makePage('tutorial/button.mdx'),
          makePage('tutorial/image-picker.mdx'),
          makePage('tutorial/sharing.mdx'),
          // makePage('tutorial/platform-differences.mdx'),
          makePage('tutorial/configuration.mdx'),
          makePage('tutorial/follow-up.mdx'),
        ],
        { expanded: true }
      ),
      makeGroup(
        'Conceptual overview',
        [
          makePage('introduction/expo.mdx'),
          makePage('introduction/managed-vs-bare.mdx'),
          // makePage('introduction/walkthrough.mdx'),
          makePage('introduction/why-not-expo.mdx'),
          makePage('introduction/faq.mdx'),
        ],
        { expanded: true }
      ),
      makeGroup(
        'Next steps',
        [makePage('next-steps/community.mdx'), makePage('next-steps/additional-resources.mdx')],
        { expanded: true }
      ),
    ],
    { expanded: true }
  ),
  makeSection('Fundamentals', [
    makePage('workflow/expo-cli.mdx'),
    makePage('workflow/expo-go.mdx'),
    makePage('workflow/using-libraries.mdx'),
    makePage('workflow/logging.mdx'),
    makePage('workflow/development-mode.mdx'),
    makePage('workflow/ios-simulator.mdx'),
    makePage('workflow/android-studio-emulator.mdx'),
    makePage('workflow/run-on-device.mdx'),
    makePage('workflow/debugging.mdx'),
    makePage('workflow/configuration.mdx'),
    makePage('workflow/upgrading-expo-sdk-walkthrough.mdx'),
    makePage('workflow/web.mdx'),
    makePage('workflow/snack.mdx'),
    makePage('workflow/customizing.mdx'),
    makePage('workflow/glossary-of-terms.mdx'),
    makePage('workflow/already-used-react-native.mdx'),
    makePage('workflow/common-development-errors.mdx'),
  ]),
  makeSection('Distributing your app', [
    makePage('distribution/introduction.mdx'),
    makePage('distribution/app-stores.mdx'),
    makePage('distribution/runtime-versions.mdx'),
    makePage('distribution/custom-updates-server.mdx'),
    makePage('distribution/app-transfers.mdx'),
    makePage('distribution/publishing-websites.mdx'),
  ]),
  makeSection('Development builds', [
    makePage('development/introduction.mdx'),
    makePage('development/getting-started.mdx'),
    makePage('development/build.mdx'),
    makePage('development/installation.mdx'),
    makePage('development/development-workflows.mdx'),
    makePage('development/extensions.mdx'),
    makePage('development/compatibility.mdx'),
    makePage('development/upgrading.mdx'),
    makePage('development/troubleshooting.mdx'),
  ]),
  makeSection('Integrations', [
    makePage('guides/using-firebase.mdx'),
    makePage('guides/setup-native-firebase.mdx'),
    makePage('guides/using-sentry.mdx'),
    makePage('guides/using-bugsnag.mdx'),
    makePage('guides/using-clojurescript.mdx'),
    makePage('guides/using-graphql.mdx'),
    makePage('guides/using-styled-components.mdx'),
    makePage('guides/using-nextjs.mdx'),
    makePage('guides/typescript.mdx'),
  ]),
  makeSection('Assorted guides', [
    makePage('guides/routing-and-navigation.mdx'),
    makePage('guides/permissions.mdx'),
    makePage('guides/authentication.mdx'),
    makePage('guides/environment-variables.mdx'),
    makePage('guides/customizing-metro.mdx'),
    makePage('guides/customizing-webpack.mdx'),
    makePage('guides/progressive-web-apps.mdx'),
    makePage('guides/web-performance.mdx'),
    makePage('guides/delaying-code.mdx'),
    makePage('guides/errors.mdx'),
    makePage('guides/testing-with-jest.mdx'),
    makePage('guides/education.mdx'),
    makePage('guides/linking.mdx'),
    makePage('guides/deep-linking.mdx'),
    makePage('guides/troubleshooting-proxies.mdx'),
    makePage('guides/config-plugins.mdx'),
    makePage('guides/monorepos.mdx'),
    makePage('guides/sharing-preview-releases.mdx'),
    makePage('guides/using-hermes.mdx'),
    makePage('guides/adopting-prebuild.mdx'),
    makePage('guides/ios-developer-mode.mdx'),
  ]),
  makeSection('Expo accounts', [
    makePage('accounts/account-types.mdx'),
    makePage('accounts/two-factor.mdx'),
    makePage('accounts/programmatic-access.mdx'),
    makePage('accounts/working-together.mdx'),
  ]),
  makeSection('Bare workflow', [
    makePage('bare/hello-world.mdx'),
    makePage('bare/installing-expo-modules.mdx'),
    makePage('bare/installing-updates.mdx'),
    makePage('bare/using-expo-client.mdx'),
    makePage('bare/updating-your-app.mdx'),
    makePage('bare/error-recovery.mdx'),
  ]),
  makeSection('Push notifications', [
    makePage('push-notifications/overview.mdx'),
    makePage('push-notifications/push-notifications-setup.mdx'),
    makePage('push-notifications/sending-notifications.mdx'),
    makePage('push-notifications/sending-notifications-custom.mdx'),
    makePage('push-notifications/receiving-notifications.mdx'),
    makePage('push-notifications/using-fcm.mdx'),
    makePage('push-notifications/faq.mdx'),
  ]),
  makeSection('UI programming', [
    makePage('guides/assets.mdx'),
    makePage('guides/icons.mdx'),
    makePage('guides/app-icons.mdx'),
    makePage('guides/splash-screens.mdx'),
    makePage('guides/configuring-statusbar.mdx'),
    makePage('guides/color-schemes.mdx'),
    makePage('guides/using-custom-fonts.mdx'),
    makePage('ui-programming/image-background.mdx'),
    makePage('ui-programming/implementing-a-checkbox.mdx'),
    makePage('ui-programming/z-index.mdx'),
    makePage('ui-programming/using-svgs.mdx'),
    makePage('ui-programming/react-native-toast.mdx'),
    makePage('ui-programming/react-native-styling-buttons.mdx'),
    makePage('guides/userinterface.mdx'),
  ]),
  makeSection('Expo Modules API', [
    makePage('modules/overview.mdx'),
    makePage('modules/module-api.mdx'),
    makePage('modules/android-lifecycle-listeners.mdx'),
    makePage('modules/appdelegate-subscribers.mdx'),
    makePage('modules/module-config.mdx'),
  ]),
  makeSection('Regulatory compliance', sortAlphabetical(pagesFromDir('regulatory-compliance')), {}),
  makeSection('Technical specs', [
    makePage('technical-specs/expo-updates-0.mdx'),
    makePage('technical-specs/expo-sfv-0.mdx'),
  ]),
  makeSection('Deprecated', [
    makeGroup('ExpoKit', [
      makePage('expokit/overview.mdx'),
      makePage('expokit/eject.mdx'),
      makePage('expokit/expokit.mdx'),
      makePage('expokit/advanced-expokit-topics.mdx'),
      makePage('expokit/universal-modules-and-expokit.mdx'),
    ]),
    makeGroup('Archived', sortAlphabetical(pagesFromDir('archived'))),
  ]),
];

const eas = [
  makeSection('EAS', [makePage('eas/index.mdx'), makePage('eas/webhooks.mdx')], { expanded: true }),
  makeSection(
    'EAS Build',
    [
      makeGroup('Start Building', [
        makePage('build/introduction.mdx'),
        makePage('build/setup.mdx'),
        makePage('build/eas-json.mdx'),
        makePage('build/internal-distribution.mdx'),
        makePage('build/automating-submissions.mdx'),
        makePage('build/updates.mdx'),
        makePage('build/building-on-ci.mdx'),
      ]),
      makeGroup('App Signing', [
        makePage('app-signing/app-credentials.mdx'),
        makePage('app-signing/managed-credentials.mdx'),
        makePage('app-signing/local-credentials.mdx'),
        makePage('app-signing/existing-credentials.mdx'),
        makePage('app-signing/syncing-credentials.mdx'),
        makePage('app-signing/security.mdx'),
      ]),
      makeGroup('Reference', [
        makePage('build-reference/eas-json.mdx'),
        makePage('build-reference/migrating.mdx'),
        makePage('build-reference/npm-hooks.mdx'),
        makePage('build-reference/how-tos.mdx'),
        makePage('build-reference/private-npm-packages.mdx'),
        makePage('build-reference/variables.mdx'),
        makePage('build-reference/apk.mdx'),
        makePage('build-reference/simulators.mdx'),
        makePage('build-reference/app-versions.mdx'),
        makePage('build-reference/troubleshooting.mdx'),
        makePage('build-reference/variants.mdx'),
        makePage('build-reference/ios-capabilities.mdx'),
        makePage('build-reference/local-builds.mdx'),
        makePage('build-reference/caching.mdx'),
        makePage('build-reference/android-builds.mdx'),
        makePage('build-reference/ios-builds.mdx'),
        makePage('build-reference/build-configuration.mdx'),
        makePage('build-reference/infrastructure.mdx'),
        makePage('build-reference/app-extensions.mdx'),
        makePage('build-reference/e2e-tests.mdx'),
        makePage('build-reference/limitations.mdx'),
      ]),
    ],
    { expanded: true }
  ),
  makeSection(
    'EAS Submit',
    [
      makePage('submit/introduction.mdx'),
      makePage('submit/eas-json.mdx'),
      makePage('submit/android.mdx'),
      makePage('submit/ios.mdx'),
      makePage('submit/classic-builds.mdx'),
    ],
    { expanded: true }
  ),
  makeSection(
    'EAS Update',
    [
      makeGroup('EAS Update', [
        makePage('eas-update/introduction.mdx'),
        makePage('eas-update/getting-started.mdx'),
        makePage('eas-update/github-actions.mdx'),
        makePage('eas-update/developing-with-eas-update.mdx'),
        makePage('eas-update/how-eas-update-works.mdx'),
        makePage('eas-update/deployment-patterns.mdx'),
        makePage('eas-update/debug-updates.mdx'),
        makePage('eas-update/eas-update-and-eas-cli.mdx'),
        makePage('eas-update/optimize-assets.mdx'),
        makePage('eas-update/migrate-to-eas-update.mdx'),
        makePage('eas-update/runtime-versions.mdx'),
        makePage('eas-update/environment-variables.mdx'),
        makePage('eas-update/expo-dev-client.mdx'),
        makePage('eas-update/known-issues.mdx'),
        makePage('eas-update/rollouts.mdx'),
        makePage('eas-update/faq.mdx'),
      ]),
    ],
    { expanded: true }
  ),
  makeSection(
    'EAS Metadata',
    [
      makePage('eas/metadata/index.mdx'),
      makePage('eas/metadata/getting-started.mdx'),
      makePage('eas/metadata/config.mdx'),
      makePage('eas/metadata/schema.mdx'),
      makePage('eas/metadata/faq.mdx'),
    ],
    { expanded: true }
  ),
];

const preview = [
  makeSection('Preview', [
    makePage('preview/introduction.mdx'),
    makePage('preview/support.mdx'),
    { expanded: true },
  ]),
];

const archive = [
  makeSection('Archive', [makeGroup('Archive', [makePage('archive/index.mdx')])], {
    expanded: true,
  }),
  makeSection(
    'Classic Updates',
    [
      makeGroup('Classic Updates', [makePage('archive/classic-updates/introduction.mdx')]),
      makeGroup('Guides', [
        makePage('archive/classic-updates/configuring-updates.mdx'),
        makePage('archive/classic-updates/preloading-and-caching-assets.mdx'),
      ]),
      makeGroup('Distribution', [
        makePage('archive/classic-updates/release-channels.mdx'),
        makePage('archive/classic-updates/advanced-release-channels.mdx'),
        makePage('archive/classic-updates/hosting-your-app.mdx'),
        makePage('archive/classic-updates/offline-support.mdx'),
        makePage('archive/classic-updates/optimizing-updates.mdx'),
      ]),
      makeGroup('Workflow', [makePage('archive/classic-updates/publishing.mdx')]),
      makeGroup('Bare Workflow', [makePage('archive/classic-updates/updating-your-app.mdx')]),
      makeGroup('Classic Services', [
        makePage('archive/classic-updates/building-standalone-apps.mdx'),
        makePage('archive/classic-updates/turtle-cli.mdx'),
      ]),
    ],
    {
      expanded: true,
    }
  ),
];

const featurePreview = [];

const versionsReference = VERSIONS.reduce(
  (all, version) => ({
    ...all,
    [version]: [
      makeSection('Configuration files', pagesFromDir(`versions/${version}/config`), {
        expanded: true,
      }),
      makeSection('Expo SDK', pagesFromDir(`versions/${version}/sdk`), { expanded: true }),
      makeSection('React Native', sortLegacyReactNative(version), { expanded: true }),
    ],
  }),
  {}
);

const reference = { ...versionsReference, latest: versionsReference[LATEST_VERSION] };

export default {
  general,
  eas,
  preview,
  archive,
  featurePreview,
  reference,
  generalDirectories,
  previewDirectories,
  easDirectories,
  archiveDirectories,
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
