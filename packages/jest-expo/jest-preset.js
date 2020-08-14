'use strict';

const cloneDeep = require('lodash/cloneDeep');
const isEqual = require('lodash/isEqual');
// Derive the Expo Jest preset from the React Native one
const jestPreset = cloneDeep(require('react-native/jest-preset'));

// transform
if (!jestPreset.transform) {
  jestPreset.transform = {};
}

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
    'node_modules/(?!(jest-)?react-native|@react-native-community)',
  ])
) {
  console.warn(
    `react-native/jest-preset contained different transformIgnorePatterns than expected`
  );
}

// Also please keep `testing-with-jest.md` file up to date
jestPreset.transformIgnorePatterns = [
  'node_modules/(?!(jest-)?react-native|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
];

// setupFiles
if (!Array.isArray(jestPreset.setupFiles)) {
  jestPreset.setupFiles = [];
}
jestPreset.setupFiles.push(require.resolve('jest-expo/src/preset/setup.js'));

module.exports = jestPreset;
