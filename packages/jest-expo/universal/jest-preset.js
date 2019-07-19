'use strict';

const reactNativePreset = require('react-native-web/jest-preset');
const expoPreset = require('../jest-preset');

const COLORS = {
  android: 'blueBright',
  ios: 'white',
  web: 'magenta',
  node: 'cyan',
};

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

function getPlatformPreset(...platforms) {
  return {
    displayName: {
      name: platforms[0].toUpperCase(),
      color: COLORS[platforms[0]],
    },
    moduleFileExtensions: getModuleFileExtensions(...platforms),
    haste: {
      ...(expoPreset.haste || {}),
      defaultPlatform: platforms[0],
      platforms,
    },
  };
}

// Combine React Native for web with React Native
// Use RNWeb for the testEnvironment
function getWebPreset() {
  return {
    ...expoPreset,
    ...reactNativePreset,
    setupFiles: [
      // ...(expoPreset.setupFiles || []),
      ...(reactNativePreset.setupFiles || []),
    ],
    moduleNameMapper: {
      ...expoPreset.moduleNameMapper,
      // Add react-native-web alias
      // This makes the tests take ~2x longer
      ...reactNativePreset.moduleNameMapper,
    },
    // Default to ios, native so the RN package can be transformed correctly.
    // TODO: Bacon: Don't use react-native package for web testing.
    ...getPlatformPreset('web'),
  };
}

function getNodePreset() {
  return {
    ...getWebPreset(),
    ...getPlatformPreset('node', 'web'),
    testEnvironment: 'node',
  };
}

module.exports = {
  projects: [
    // Create a new project for each platform.
    ...['ios', 'android'].map(platform => ({
      ...expoPreset,
      ...getPlatformPreset(platform, 'native'),
    })),
    getWebPreset(),
    getNodePreset(),
  ],
};
