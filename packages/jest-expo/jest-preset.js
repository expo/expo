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

const defaultAssetNamePattern = '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$';
if (!jestPreset.transform[defaultAssetNamePattern]) {
  console.warn(`Expected react-native/jest-preset to define transform[${defaultAssetNamePattern}]`);
} else {
  delete jestPreset.transform[defaultAssetNamePattern];
}

const assetNamePattern =
  '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf|m4v|mov|mp4|mpeg|mpg|webm|aac|aiff|caf|m4a|mp3|wav|html|pdf|obj)$';
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

// Also please keep `testing-with-jest.md` file up to date
jestPreset.transformIgnorePatterns = [
  '/node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  '/node_modules/react-native-reanimated/plugin/',
];

// setupFiles
if (!Array.isArray(jestPreset.setupFiles)) {
  jestPreset.setupFiles = [];
}
jestPreset.setupFiles.push(require.resolve('jest-expo/src/preset/setup.js'));

// Add typescript custom mapping
module.exports = withTypescriptMapping(jestPreset);
