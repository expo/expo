'use strict';

const cloneDeep = require('lodash/cloneDeep');
const isEqual = require('lodash/isEqual');

let jestPreset;
try {
  jestPreset = require('@react-native/jest-preset');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    try {
      // NOTE(@kitten): We can still try the old import to see if it
      // works, in case there's some kind of version mismatch
      jestPreset = require('react-native/jest-preset');
    } catch {
      throw new Error(
        'The React Native Jest preset that jest-expo relies on has moved to a separate package.\n' +
          'To migrate, please install "@react-native/jest-preset" to fulfill jest-expo\'s peer dependency.'
      );
    }
  }
}

jestPreset = cloneDeep(jestPreset);

const { withTypescriptMapping } = require('./src/preset/withTypescriptMapping');
const { resolveBabelConfig } = require('./src/resolveBabelConfig');

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
const babelOpts = {
  caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
};
const babelConfigFile = resolveBabelConfig(process.cwd());
if (babelConfigFile) {
  babelOpts.configFile = babelConfigFile;
}
jestPreset.transform['\\.[jt]sx?$'] = ['babel-jest', babelOpts];

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
jestPreset.transform[assetNamePattern] =
  require.resolve('jest-expo/src/preset/assetFileTransformer.js');

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
  '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base))',
  // Disable transforming the reanimated plugin in multi-platform tests, causing "Reentrant plugin detected trying to load react-native-reanimated/plugin.."
  '/node_modules/react-native-reanimated/plugin/',
  // Disable transforming the react-native babel preset, since it's part of the transformer itself
  '/node_modules/@react-native/babel-preset/',
];

// setupFiles
if (!Array.isArray(jestPreset.setupFiles)) {
  jestPreset.setupFiles = [];
}
jestPreset.setupFiles.push(require.resolve('jest-expo/src/preset/setup.js'));

// Add typescript custom mapping
module.exports = withTypescriptMapping(jestPreset);
