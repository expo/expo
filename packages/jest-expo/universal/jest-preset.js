'use strict';

const reactNativePreset = require('react-native-web/jest-preset');
const expoPreset = require('../jest-preset');

function getModuleFileExtensions(...platforms) {
  let fileExtensions = [];

  // Support both TypeScript and JavaScript
  for (const extension of ['ts', 'tsx', 'js', 'jsx']) {
    // Ensure order is correct: [platformA.js, platformB.js, js]
    for (const platform of platforms.concat([''])) {
      fileExtensions.push([platform, extension].filter(Boolean).join('.'));
    }
  }
  // Always add this last
  fileExtensions.push('json');
  return fileExtensions;
}

function getPlatformPreset(displayOptions, extensions) {
  return {
    displayName: displayOptions,
    moduleFileExtensions: getModuleFileExtensions(...extensions),
    haste: {
      ...expoPreset.haste,
      defaultPlatform: extensions[0],
      platforms: extensions,
    },
  };
}

// Combine React Native for web with React Native
// Use RNWeb for the testEnvironment
function getWebPreset() {
  return {
    ...expoPreset,
    ...reactNativePreset,
    setupFiles: reactNativePreset.setupFiles,
    moduleNameMapper: {
      ...expoPreset.moduleNameMapper,
      // Add react-native-web alias
      // This makes the tests take ~2x longer
      ...reactNativePreset.moduleNameMapper,
    },
    // Default to ios, native so the RN package can be transformed correctly.
    ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web']),
  };
}

function getNodePreset() {
  return {
    ...getWebPreset(),
    ...getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web']),
    testEnvironment: 'node',
  };
}

module.exports = {
  projects: [
    // Create a new project for each platform.
    {
      ...expoPreset,
      ...getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native']),
    },
    {
      ...expoPreset,
      ...getPlatformPreset({ name: 'Android', color: 'blueBright' }, ['android', 'native']),
    },
    getWebPreset(),
    getNodePreset(),
  ],
};
