'use strict';
const { getBareExtensions } = require('@expo/config/paths');

const { withWatchPlugins } = require('./withWatchPlugins');
const expoPreset = require('../jest-preset');

function getUpstreamBabelJest(transform) {
  const upstreamBabelJest = Object.keys(transform).find((key) =>
    Array.isArray(transform[key])
      ? transform[key][0] === 'babel-jest'
      : transform[key] === 'babel-jest'
  );
  return upstreamBabelJest;
}

function getPlatformPreset(displayOptions, extensions, platform, isServer) {
  const moduleFileExtensions = getBareExtensions(extensions, {
    isTS: true,
    isReact: true,
    isModern: false,
  });
  const testMatch = ['', ...extensions].flatMap((extension) => {
    const platformExtension = extension ? `.${extension}` : '';
    const sourceExtension = `.[jt]s?(x)`;
    return [
      `**/__tests__/**/*spec${platformExtension}${sourceExtension}`,
      `**/__tests__/**/*test${platformExtension}${sourceExtension}`,
      `**/?(*.)+(spec|test)${platformExtension}${sourceExtension}`,
    ];
  });

  const upstreamBabelJest = getUpstreamBabelJest(expoPreset.transform) ?? '\\.[jt]sx?$';

  return withWatchPlugins({
    transform: {
      ...expoPreset.transform,
      [upstreamBabelJest]: [
        'babel-jest',
        {
          caller: {
            name: 'metro',
            bundler: 'metro',
            // Add support for the `platform` babel transforms and inlines such as
            // Platform.OS and `process.env.EXPO_OS`.
            platform,
            // Add support for removing server related code from the bundle.
            isServer,
          },
        },
      ],
    },
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
      ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web'], 'web'),
      testEnvironment: 'jsdom',
    };
  },
  getNodePreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web'], 'web', true),
      testEnvironment: 'node',
    };
  },
  getIOSPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native'], 'ios'),
    };
  },
  getAndroidPreset() {
    return {
      ...expoPreset,
      ...getPlatformPreset(
        { name: 'Android', color: 'blueBright' },
        ['android', 'native'],
        'android'
      ),
    };
  },
};
