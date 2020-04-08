const prevaledNavigationData = require('./navigation-data');
const packageVersion = require('../package.json').version;

// Groups of sections
// - Each section is a top-level folder within the version directory
// - The groups of sections are expressed only below, there is no representation of them in the filesystem
const GROUPS = {
  'The Basics': ['Introduction', 'Get Started', 'Tutorial', 'Next Steps'],
  'Managed Workflow': ['Fundamentals', 'Guides', 'Distributing Your App', 'ExpoKit'],
  'Bare Workflow': ['Essentials'],
  'API Reference': ['Expo SDK', 'React Native'],
};

// This array provides the ordering for pages within each section
const sections = [
  {
    name: 'Introduction',
    reference: [
      'Introduction',
      'Workflows',
      'Walkthrough',
      'Limitations',
      'Frequently asked questions',
      'Common Questions',
    ],
  },
  {
    name: 'Get Started',
    reference: ['Installation', 'Create a new app'],
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
    name: 'Guides',
    reference: [
      'App Icons',
      'Assets',
      'Error Handling',
      'Preloading & Caching Assets',
      'Icons',
      'Custom Fonts',
      'Using Custom Fonts',
      'Routing & Navigation',
      'Configuring StatusBar',
      'Create a Splash Screen',
      'Offline Support',
      'Configuring OTA Updates',
      'Account Permissions',
      'Push Notifications',
      'Using FCM for Push Notifications',
      'Notification Channels',
      'Testing with Jest',
      'Using TypeScript',
      'Using Modern JavaScript',
      'Using ClojureScript',
      'Using Firebase',
      'Using GraphQL',
      'Using Sentry',
      'Using Bugsnag',
      'User Interface Component Libraries',
      'Crafting Educational Materials',
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
      'Viewing Logs',
      'Debugging',
      'Development Mode',
      'Common Development Errors',
      'iOS Simulator',
      'Android Studio Emulator',
      'Configuration with app.json',
      'Publishing',
      'Release Channels',
      'Building Standalone Apps',
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
  'Introduction',
  'Get Started',
  'Tutorial',
  'Fundamentals',
  'Guides',
  'Distributing Your App',
  'ExpoKit',
  'Essentials',
  'Expo SDK',
  'React Native',
];

const sortAccordingToReference = (arr, reference) => {
  reference = Array.from(reference).reverse();

  let subSort = (arr, i) => arr.slice(0, i).concat(arr.slice(i).sort());

  arr.forEach(category => {
    category.weight = reference.indexOf(category.name) * -1;
  });

  let arrSortedByWeight = arr.sort((a, b) => a.weight - b.weight);
  return subSort(arrSortedByWeight, arrSortedByWeight.findIndex(o => o.weight === 1));
};

const sortNav = nav => {
  nav = sortAccordingToReference(nav, ROOT);

  sections.forEach(({ name, reference }) => {
    let section = nav.find(o => {
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
  let sections = [];
  let groupNameToSectionIndex = {};
  nav.forEach(section => {
    // This moves the "Overview" post to the top of the Expo SDK section
    if (section.name === 'Expo SDK') {
      let overview;
      section.posts.forEach(post => {
        if (post.name === 'Overview') {
          overview = post;
        }
      });
      if (overview) {
        section.posts.splice(section.posts.indexOf(overview), 1);
        section.posts.unshift(overview);
      }
    }

    // If it's grouped then we add it
    let groupName = getGroupForSectionName(section.name);
    if (groupName) {
      if (groupNameToSectionIndex.hasOwnProperty(groupName)) {
        let existingSectionIndex = groupNameToSectionIndex[groupName];
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

const sortedNavigation = Object.assign(
  ...Object.entries(prevaledNavigationData).map(([version, versionNavigation]) => ({
    [version]: groupNav(sortNav(versionNavigation)),
  }))
);

module.exports = { ...sortedNavigation, latest: sortedNavigation['v' + packageVersion] };
