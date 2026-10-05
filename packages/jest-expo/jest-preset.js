'use strict';

const cloneDeep = require('lodash/cloneDeep');
const isEqual = require('lodash/isEqual');
const path = require('node:path');

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

// Use jest-expo's own copy of the React Native test environment. The upstream preset resolves
// `jest-environment-node` from its own (Jest 29) dependencies, which must not be mixed into a Jest 30
// runtime. The environment is otherwise identical to `@react-native/jest-preset/jest/react-native-env`.
jestPreset.testEnvironment = require.resolve('./src/preset/nativeEnvironment.js');

const { withTypescriptMapping } = require('./src/preset/withTypescriptMapping');
const { resolveBabelOptions } = require('./src/resolveBabelOptions');

// NOTE: Jest 30 replaced its resolver with `unrs-resolver` and dropped the `packageFilter` option,
// so `@react-native/jest-preset`'s resolver can no longer strip `react-native`'s `exports` map.
// Mapped module targets must be absolute paths, since bare `react-native/src/*` subpaths are
// not listed in `exports`.
const reactNativeAssetRegistry = path.join(
  path.dirname(require.resolve('react-native/package.json')),
  'src/asset-registry.js'
);

// Emulate the alias behavior of Expo's Metro resolver.
jestPreset.moduleNameMapper = {
  '^react-native/asset-registry$': reactNativeAssetRegistry,
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
// Resolve `babel-jest` from jest-expo so the Jest 30 version is used. `@react-native/jest-preset`
// still depends on `babel-jest@29`, and a bare `'babel-jest'` would resolve from the project root,
// where hoisting decides which of the two copies wins.
const babelJestPath = require.resolve('babel-jest');
const babelOpts = resolveBabelOptions(process.cwd());
jestPreset.transform['\\.[jt]sx?$'] = [babelJestPath, babelOpts];

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
  '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation))',
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

// Don't fail a package that ships the preset but has no test files yet.
jestPreset.passWithNoTests = true;

Object.assign(jestPreset, require('jest-expo/config/maxWorkers'));

// Add typescript custom mapping
module.exports = withTypescriptMapping(jestPreset);
