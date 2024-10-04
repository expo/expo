// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.join(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'kml' // See: ../native-component-list/assets/expo-maps/sample_kml.kml
);

config.resolver.blockList = [
  // Because react-native versions may be different between node_modules/react-native and react-native-lab,
  // metro and react-native cannot serve duplicated files from different paths.
  // Assuming NCL only serves for Expo Go,
  // the strategy here is to serve react-native imports from `react-native-lab/react-native` but not its transitive dependencies.
  // That is not ideal but should work for most cases if the two react-native versions do not have too much difference.
  // For example, `react-native-lab/react-native/node_modules/@react-native/polyfills` and `node_modules/@react-native/polyfills` may be different,
  // the metro config will use the transitive dependency from `node_modules/@react-native/polyfills`.
  /\breact-native-lab\/react-native\/node_modules\b/,

  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,
];

// To test NCL from Expo Go, the react-native js source is from our fork.
config.serializer.getPolyfills = () => {
  const reactNativeRoot = path.join(
    monorepoRoot,
    'react-native-lab',
    'react-native',
    'packages',
    'react-native'
  );

  return require(path.join(reactNativeRoot, 'rn-get-polyfills'))();
};

module.exports = config;
