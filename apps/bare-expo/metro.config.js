// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'db', // See: ../test-suite/assets/asset-db.db
  'kml' // See: ../native-component-list/assets/expo-maps/sample_kml.kml
);

config.resolver.blockList = [
  // Exclude react-native-lab from haste map.
  // Because react-native versions may be different between node_modules/react-native and react-native-lab,
  // we should use the one from node_modules for bare-expo.
  /\breact-native-lab\b/,

  // Copied from expo-yarn-workspaces
  /\/__tests__\//,
  /\/android\/React(Android|Common)\//,
  /\/versioned-react-native\//,
];

module.exports = config;
