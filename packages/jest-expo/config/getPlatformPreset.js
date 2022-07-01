'use strict';
const { getManagedExtensions } = require('@expo/config/paths');

const expoPreset = require('../jest-preset');
const { withWatchPlugins } = require('./withWatchPlugins');

function getPlatformPreset(displayOptions, extensions) {
  const moduleFileExtensions = getManagedExtensions(extensions, {
    isTS: true,
    isReact: true,
    isModern: false,
  });
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
  return {
    ...expoPreset,
    setupFiles: [require.resolve('../src/preset/setup-web.js')],
    moduleNameMapper: {
      ...expoPreset.moduleNameMapper,
      // Add react-native-web alias
      // This makes the tests take ~2x longer
      '^react-native$': 'react-native-web',
    },
  };
}

module.exports = {
  getWebPreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web']),
      testEnvironment: 'jsdom',
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
