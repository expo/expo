'use strict';
const expoPreset = require('../jest-preset');
const { withWatchPlugins } = require('./withWatchPlugins');

function getModuleFileExtensions(...platforms) {
  let fileExtensions = [];

  // Support both TypeScript and JavaScript
  for (const extension of ['ts', 'tsx', 'js', 'jsx']) {
    // Ensure order is correct: [platformA.js, platformB.js, js]
    for (const platform of [...platforms, '']) {
      fileExtensions.push([platform, extension].filter(Boolean).join('.'));
    }
  }
  // Always add this last
  fileExtensions.push('json');
  return fileExtensions;
}

function getPlatformPreset(displayOptions, extensions) {
  const moduleFileExtensions = getModuleFileExtensions(...extensions);
  const testMatch = ['', ...extensions].reduce((arr, cur) => {
    const platformExtension = cur ? `.${cur}` : '';
    const sourceExtension = `.[jt]s?(x)`;
    return [
      ...arr,
      `**/__tests__/**/*spec${platformExtension}${sourceExtension}`,
      `**/__tests__/**/*test${platformExtension}${sourceExtension}`,
      `**/?(*.)+(spec|test)${platformExtension}${sourceExtension}`,
    ];
  }, []);

  return withWatchPlugins({
    displayName: displayOptions,
    testMatch,
    moduleFileExtensions,
    snapshotResolver: require.resolve(`../src/snapshot/resolver.${extensions[0]}.js`),
    haste: {
      ...expoPreset.haste,
      defaultPlatform: extensions[0],
      platforms: extensions,
    },
  });
}

// Combine React Native for web with React Native
// Use RNWeb for the testEnvironment
function getBaseWebPreset() {
  let reactNativePreset;
  try {
    reactNativePreset = require('react-native-web/jest-preset');
  } catch (error) {
    console.error(error);
    throw error;
  }
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
  };
}

module.exports = {
  getWebPreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web']),
    };
  },
  getNodePreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web']),
      testEnvironment: 'node',
    };
  },
  getIOSPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native']),
    };
  },
  getAndroidPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset({ name: 'Android', color: 'blueBright' }, ['android', 'native']),
    };
  },
};
