'use strict';

const isEqual = require('lodash/isEqual');

// Derive the Expo Jest preset from the React Native one
const jestPreset = require('react-native/jest-preset');

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
    'node_modules/(?!(jest-)?react-native|react-clone-referenced-element|@react-native-community)',
  ])
) {
  console.warn(
    `react-native/jest-preset contained different transformIgnorePatterns than expected`
  );
}

jestPreset.transformIgnorePatterns = [
  'node_modules/(?!(jest-)?react-native|react-clone-referenced-element|@react-native-community|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|sentry-expo|native-base|react-native-svg)',
];

// setupFiles
if (!Array.isArray(jestPreset.setupFiles)) {
  jestPreset.setupFiles = [];
}
jestPreset.setupFiles.push(require.resolve('jest-expo/src/preset/setup.js'));

function getModuleFileExtensions(...platforms) {
  let fileExtensions = [];

  // Support both TypeScript and JavaScript
  for (const language of ['t', 'j']) {
    // Support JS and JSX
    for (const extension of [`${language}s`, `${language}sx`]) {
      // Ensure order is correct: [platformA.js, platformB.js, js]
      for (const platform of platforms.concat([''])) {
        fileExtensions.push([platform, extension].filter(Boolean).join('.'));
      }
    }
  }
  // Always add this last
  fileExtensions.push('json');
  return fileExtensions;
}

const COLORS = {
  android: 'blueBright',
  ios: 'white',
  web: 'magenta',
  node: 'cyan',
};

function getPlatformPreset(...platforms) {
  return {
    displayName: {
      name: platforms[0].toUpperCase(),
      color: COLORS[platforms[0]],
    },
    moduleFileExtensions: getModuleFileExtensions(...platforms),
    haste: {
      ...(jestPreset.haste || {}),
      defaultPlatform: platforms[0],
      platforms,
    },
  };
}

// Combine React Native for web with React Native
// Use RNWeb for the testEnvironment
function getWebPreset() {
  return {
    ...jestPreset,
    ...presetRNW,
    setupFiles: [...(jestPreset.setupFiles || []), ...(presetRNW.setupFiles || [])],
    moduleNameMapper: {
      ...jestPreset.moduleNameMapper,
      // Add react-native-web alias
      // This makes the tests take ~2x longer
      ...presetRNW.moduleNameMapper,
    },
    // Default to ios, native so the RN package can be transformed correctly.
    // TODO: Bacon: Don't use react-native package for web testing.
    ...getPlatformPreset('web', 'ios', 'native'),
  };
}

function getNodePreset() {
  return {
    ...getWebPreset(),
    ...getPlatformPreset('node', 'web', 'ios', 'native'),
    testEnvironment: 'node',
  };
}

const presetRNW = require('react-native-web/jest-preset');

module.exports = {
  projects: [
    // Create a new project for each platform.
    ...['ios', 'android'].map(platform => ({
      ...jestPreset,
      ...getPlatformPreset(platform, 'native'),
    })),
    getWebPreset(),
    // getNodePreset(),
  ],
};
