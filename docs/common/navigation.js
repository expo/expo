const packageVersion = require('../package.json').version;
const prevaledNavigationData = require('./navigation-data');

// Groups of sections
// - Each section is a top-level folder within the version directory
// - The groups of sections are expressed only below, there is no representation of them in the filesystem
const GROUPS = {
  'The Basics': ['Conceptual Overview', 'Get Started', 'Tutorial', 'Next Steps'],
  'Managed Workflow': ['Fundamentals', 'Distributing Your App', 'Assorted Guides'],
  Deprecated: ['ExpoKit'],
  'Bare Workflow': ['Essentials'],
  'Expo SDK': ['Expo SDK'],
  'React Native': ['React Native'],
};

// This array provides the ordering for pages within each section
const sections = [
  {
    name: 'Get Started',
    reference: ['Installation', 'Create a new app'],
  },
  {
    name: 'Conceptual Overview',
    reference: [
      'Workflows',
      'Walkthrough',
      'Limitations',
      'Frequently asked questions',
      'Common Questions',
    ],
  },
  {
    name: 'Tutorial',
    reference: [
      'First steps',
      'Styling text',
      'Adding an image',
      'Creating a button',
      'Picking an image',
      'Sharing the image',
      'Handling platform differences',
      'Configuring a splash screen and app icon',
      'Learning more',
    ],
  },
  {
    name: 'Next Steps',
    reference: ['Using the documentation', 'Join the community', 'Additional resources'],
  },
  {
    name: 'Assorted Guides',
    reference: [
      'Assets',
      'Icons',
      'Using Custom Fonts',
      'Routing & Navigation',
      'Authentication',
      'App Icons',
      'Create a Splash Screen',
      'Configuring the Status Bar',
      'Configuring OTA Updates',
      'Preloading & Caching Assets',
      'Offline Support',
      'Progressive Web Apps',
      'Customizing Metro',
      'Customizing Webpack',
      'Push Notifications',
      'Using FCM for Push Notifications',
      'Notification Channels',
      'Error Handling',
      'Testing with Jest',
      'Account Permissions',
      'Using TypeScript',
      'Using Modern JavaScript',
      'Using ClojureScript',
      'Using Firebase',
      'Using GraphQL',
      'Using Sentry',
      'Using Bugsnag',
      'User Interface Component Libraries',
      'Crafting Educational Materials',
      'Custom Fonts',
    ],
  },
  {
    name: 'Distributing Your App',
    reference: [
      'Overview',
      'Building Standalone Apps',
      'App signing',
      'Deploying to App Stores',
      'Release Channels',
      'Advanced Release Channels',
      'Hosting An App on Your Servers',
      'Building Standalone Apps on Your CI',
      'Uploading Apps to the Apple App Store and Google Play',
      'App Transfers',
      'Security',
    ],
  },
  {
    name: 'ExpoKit',
    reference: [
      'Overview',
      'Detaching to ExpoKit',
      'Ejecting to ExpoKit',
      'Developing With ExpoKit',
      'Advanced ExpoKit Topics',
      'Universal Modules and ExpoKit',
    ],
  },
  {
    name: 'Fundamentals',
    reference: [
      'Managed Workflow Walkthrough',
      'Up and Running',
      'Expo CLI',
      'Using Libraries',
      'Viewing Logs',
      'Development and Production Mode',
      'iOS Simulator',
      'Android Studio Emulator',
      'Debugging',
      'Common Development Errors',
      'Configuration with app.json',
      'Publishing',
      'Release Channels',
      'Building Standalone Apps',
      'Developing for Web',
      'Upgrading Expo SDK Walkthrough',
      'Linking',
      'How Expo Works',
      'Ejecting to Bare Workflow',
      'Glossary of terms',
      'exp Command-Line Interface',
    ],
  },
  {
    name: 'Essentials',
    reference: [
      'Bare Workflow Walkthrough',
      'Up and Running',
      'Using Libraries',
      'Existing Apps',
      'Supported Expo SDK APIs',
      'Using Expo client',
      'Using Expo for web',
      'Ejecting from Managed Workflow',
      'Migrating from ExpoKit',
      'Updating your App',
    ],
  },
  {
    name: 'React Native',
    reference: [
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
    ],
  },
];

// Order of sections (mapped from directory names in navigation-data.js DIR_MAPPING)
// TODO(brentvatne): this doesn't make too much sense because of higher level groupings, should
// move this logic to GROUPS instead
const ROOT = [
  'Get Started',
  'Tutorial',
  'Conceptual Overview',
  'Fundamentals',
  'Distributing Your App',
  'Assorted Guides',
  'Essentials',
  'Expo SDK',
  'React Native',
  'ExpoKit',
];

const sortAccordingToReference = (arr, reference) => {
  reference = Array.from(reference).reverse();

  const subSort = (arr, i) => arr.slice(0, i).concat(arr.slice(i).sort());

  arr.forEach(category => {
    category.weight = reference.indexOf(category.name) * -1;
  });

  const arrSortedByWeight = arr.sort((a, b) => a.weight - b.weight);
  return subSort(
    arrSortedByWeight,
    arrSortedByWeight.findIndex(o => o.weight === 1)
  );
};

const sortNav = nav => {
  nav = sortAccordingToReference(nav, ROOT);

  sections.forEach(({ name, reference }) => {
    const section = nav.find(o => {
      return o.name.toLowerCase() === name.toLowerCase();
    });
    if (section) {
      section.posts = sortAccordingToReference(section.posts, reference);
    }
  });

  return nav;
};

// Get the name of the group that a section belongs to
function getGroupForSectionName(sectionName) {
  return Object.keys(GROUPS).find(groupName => GROUPS[groupName].includes(sectionName));
}

// Yikes, this groups together multiple sections under one heading
const groupNav = nav => {
  const sections = [];
  const groupNameToSectionIndex = {};
  nav.forEach(section => {
    // If it's grouped then we add it
    const groupName = getGroupForSectionName(section.name);
    if (groupName) {
      if (groupNameToSectionIndex.hasOwnProperty(groupName)) {
        const existingSectionIndex = groupNameToSectionIndex[groupName];
        sections[existingSectionIndex].children.push(section);
      } else {
        groupNameToSectionIndex[groupName] = sections.length;
        sections.push({
          name: groupName,
          children: [section],
        });
      }
      // If it's not grouped then it just gets added to the root
    } else {
      sections.push(section);
    }
  });

  return sections;
};

const sortedReference = Object.assign(
  ...Object.entries(prevaledNavigationData.reference).map(([version, versionNavigation]) => ({
    [version]: groupNav(sortNav(versionNavigation)),
  }))
);

const sortedGeneral = groupNav(sortNav(prevaledNavigationData.general));
const sortedStarting = groupNav(sortNav(prevaledNavigationData.starting));

module.exports = {
  generalDirectories: prevaledNavigationData.generalDirectories,
  startingDirectories: prevaledNavigationData.startingDirectories,
  starting: sortedStarting,
  general: sortedGeneral,
  reference: { ...sortedReference, latest: sortedReference['v' + packageVersion] },
};
