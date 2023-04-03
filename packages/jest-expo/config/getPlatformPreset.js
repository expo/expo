'use strict';
const { getBareExtensions } = require('@expo/config/paths');
const expoPreset = require('../jest-preset');
const { withWatchPlugins } = require('./withWatchPlugins');

function getPlatformPreset(displayOptions, extensions) {
  const moduleFileExtensions = getBareExtensions(extensions, {
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
      transform: {
        ...expoPreset?.transform,
        '^.+\\.(js|ts|tsx)$': require.resolve('./babel-jest/web.js'),
      },
      ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web']),
      testEnvironment: 'jsdom',
    };
  },
  getNodePreset() {
    return {
      ...getBaseWebPreset(),
      transform: {
        ...expoPreset?.transform,
        '^.+\\.(js|ts|tsx)$': require.resolve('./babel-jest/web.js'),
      },
      ...getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web']),
      testEnvironment: 'node',
    };
  },
  getIOSPreset() {
    return {
      ...expoPreset,
      transform: {
        ...expoPreset?.transform,
        '^.+\\.(js|ts|tsx)$': require.resolve('./babel-jest/ios.js'),
      },
      ...getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native']),
    };
  },
  getAndroidPreset() {
    return {
      ...expoPreset,
      transform: {
        ...expoPreset?.transform,
        '^.+\\.(js|ts|tsx)$': require.resolve('./babel-jest/android.js'),
      },
      ...getPlatformPreset({ name: 'Android', color: 'blueBright' }, ['android', 'native']),
    };
  },
};
