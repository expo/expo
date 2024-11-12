'use strict';

const cloneDeep = require('lodash/cloneDeep');
const isEqual = require('lodash/isEqual');
// Derive the Expo Jest preset from the React Native one
const jestPreset = cloneDeep(require('react-native/jest-preset'));

const { withTypescriptMapping } = require('./src/preset/withTypescriptMapping');

// Emulate the alias behavior of Expo's Metro resolver.
jestPreset.moduleNameMapper = {
  ...(jestPreset.moduleNameMapper || {}),
  '^react-native-vector-icons$': '@expo/vector-icons',
  '^react-native-vector-icons/(.*)': '@expo/vector-icons/$1',
};

const upstreamBabelJest = Object.keys(jestPreset.transform).find(
  (key) => jestPreset.transform[key] === 'babel-jest'
);
if (upstreamBabelJest) {
  delete jestPreset.transform[upstreamBabelJest];
}

// transform
jestPreset.transform['\\.[jt]sx?$'] = [
  'babel-jest',
  { caller: { name: 'metro', bundler: 'metro', platform: 'ios' } },
];

/* Update this when metro changes their default extensions */
const defaultMetroAssetExts = [
  // Image formats
  'bmp',
  'gif',
  'jpg',
  'jpeg',
  'png',
  'psd',
  'svg',
  'webp',
  'xml',
  // Video formats
  'm4v',
  'mov',
  'mp4',
  'mpeg',
  'mpg',
  'webm',
  // Audio formats
  'aac',
  'aiff',
  'caf',
  'm4a',
  'mp3',
  'wav',
  // Document formats
  'html',
  'pdf',
  'yaml',
  'yml',
  // Font formats
  'otf',
  'ttf',
  // Archives (virtual files)
  'zip',
];

/** Update this when we change @expo/metro-config */
const defaultExpoMetroAssetExts = [
  ...defaultMetroAssetExts,
  // Add default support for `expo-image` file types.
  'heic',
  'avif',
  // Add default support for `expo-sqlite` file types.
  'db',
];

const assetNamePattern = `^.+\\.(${defaultExpoMetroAssetExts.join('|')})$`;
jestPreset.transform[assetNamePattern] = require.resolve(
  'jest-expo/src/preset/assetFileTransformer.js'
);

// transformIgnorePatterns
if (!Array.isArray(jestPreset.transformIgnorePatterns)) {
  console.warn(`Expected react-native/jest-preset to define a transformIgnorePatterns array`);
} else if (
  !isEqual(jestPreset.transformIgnorePatterns, [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)/)',
  ])
) {
  console.warn(
    `react-native/jest-preset contained different transformIgnorePatterns than expected`
  );
}

// Also please keep `unit-testing.mdx` file up to date
jestPreset.transformIgnorePatterns = [
  '/node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  '/node_modules/react-native-reanimated/plugin/',
];

// setupFiles
if (!Array.isArray(jestPreset.setupFiles)) {
  jestPreset.setupFiles = [];
}
jestPreset.setupFiles.push(require.resolve('jest-expo/src/preset/setup.js'));

// Add typescript custom mapping
module.exports = withTypescriptMapping(jestPreset);
