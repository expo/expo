'use strict';
const { getManagedExtensions } = require('@expo/config/paths');
const os = require('os');
const path = require('path');
const expoPreset = require('../jest-preset');
const { withWatchPlugins } = require('./withWatchPlugins');

function getPlatformPreset(displayOptions, extensions, ignoreExtensions) {
  const moduleFileExtensions = getManagedExtensions(extensions);
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

  const platform = extensions[0];

  return withWatchPlugins({
    displayName: displayOptions,
    testMatch,
    moduleFileExtensions,
    snapshotResolver: require.resolve(`../src/snapshot/resolver.${platform}.js`),
    haste: {
      ...expoPreset.haste,
      defaultPlatform: platform,
      platforms: extensions,
    },
    cacheDirectory: path.join(os.tmpdir(), platform),
    coverageDirectory: `<rootDir>/coverage/${platform}`,
    collectCoverageFrom: [
      '<rootDir>/src/**/*.{js,jsx,ts,tsx}',
      `!<rootDir>/src/**/*.{${ignoreExtensions.join(',')}}.{js,jsx,ts,tsx}`,
      '!**/node_modules/**',
      '!**/vendor/**',
    ],
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
      ...getPlatformPreset(
        { name: 'Web', color: 'magenta' },
        ['web'],
        ['ios', 'android', 'native', 'node']
      ),
    };
  },
  getNodePreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset(
        { name: 'Node', color: 'cyan' },
        ['node', 'web'],
        ['ios', 'android', 'native']
      ),
      testEnvironment: 'node',
    };
  },
  getIOSPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset(
        { name: 'iOS', color: 'white' },
        ['ios', 'native'],
        ['android', 'web', 'node']
      ),
    };
  },
  getAndroidPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset(
        { name: 'Android', color: 'blueBright' },
        ['android', 'native'],
        ['ios', 'web', 'node']
      ),
    };
  },
};
