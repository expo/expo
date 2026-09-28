// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.watchFolders = [];
config.transformerPath = require.resolve('./shadowDomCssTransformer');
// NOTE(@hassankhan): Prevents modules from being bundled twice through `src/` and `build/`
config.resolver.unstable_conditionNames = [
  ...config.resolver.unstable_conditionNames,
  'expo-source',
];

module.exports = config;
