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

function getPlatformPreset(displayOptions, extensions, platform, { isServer, isReactServer } = {}) {
  const moduleFileExtensions = getBareExtensions(extensions, {
    isTS: true,
    isReact: true,
    isModern: false,
  });
  const testMatch = ['', ...extensions].flatMap((extension) => {
    const platformExtension = extension ? `.${extension}` : '';
    const sourceExtension = `.[jt]s?(x)`;

    // NOTE(EvanBacon): For now (assuming this doesn't stick), we'll only run RSC on tests in the `/__rsc_tests__/` directory.
    if (isReactServer) {
      return [
        `**/__rsc_tests__/**/*spec${platformExtension}${sourceExtension}`,
        `**/__rsc_tests__/**/*test${platformExtension}${sourceExtension}`,
        `**/?(*.)+(spec|test)${platformExtension}${sourceExtension}`,
      ];
    }

    return [
      `**/__tests__/**/*spec${platformExtension}${sourceExtension}`,
      `**/__tests__/**/*test${platformExtension}${sourceExtension}`,
      `**/?(*.)+(spec|test)${platformExtension}${sourceExtension}`,
    ];
  });

  const upstreamBabelJest = getUpstreamBabelJest(expoPreset.transform) ?? '\\.[jt]sx?$';

  if (isReactServer && displayOptions && displayOptions.name) {
    displayOptions.name = `rsc/${extensions[0]}`;
  }

  const preset = withWatchPlugins({
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
            // Bundle in React Server Component mode.
            isReactServer,
          },
        },
      ],
    },

    displayName: displayOptions,
    testMatch,
    testPathIgnorePatterns: isReactServer
      ? ['/node_modules/', '/__tests__/']
      : [
          '/node_modules/',
          // Ignore the files in the `__rsc_tests__` directory when not targeting RSC.
          '/__rsc_tests__/',
        ],
    moduleFileExtensions,
    snapshotResolver: isReactServer
      ? require.resolve(`../src/snapshot/rsc/resolver.${extensions[0]}.js`)
      : require.resolve(`../src/snapshot/resolver.${extensions[0]}.js`),
    haste: {
      ...expoPreset.haste,
      defaultPlatform: extensions[0],
      platforms: extensions,
    },
  });

  if (isServer) {
    preset.testEnvironment = 'node';
  }

  if (isReactServer) {
    try {
      // This will throw if React isn't the right version.
      require('react-server-dom-webpack/server');
    } catch {
      // Use a resolver which redirects to the canaries directory for React and React DOM.
      preset.resolver = require.resolve('./react-canaries-resolver');
    }

    preset.testEnvironment = 'node';
    if (!preset.setupFiles) {
      preset.setupFiles = [];
    }
    preset.setupFiles.push(require.resolve('../src/preset/setup-rsc.js'));

    // Setup custom expect matchers
    preset.setupFilesAfterEnv ??= [];
    preset.setupFilesAfterEnv.push(require.resolve('../src/rsc-expect.ts'));

    preset.testEnvironmentOptions ??= {};
    // Matches withMetroMultiPlatform, e.g. resolution for RSC.
    preset.testEnvironmentOptions.customExportConditions = [
      'node',
      'require',
      'react-server',
      'workerd',
    ];
  }

  return preset;
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
  getWebPreset({ isReactServer } = {}) {
    const preset = {
      ...getBaseWebPreset(),
      testEnvironment: 'jsdom',
      ...getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web'], 'web', {
        isReactServer,
      }),
    };
    return preset;
  },
  getNodePreset() {
    return {
      ...getBaseWebPreset(),
      ...getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web'], 'web', {
        isServer: true,
      }),
    };
  },
  getIOSPreset({ isReactServer } = {}) {
    return {
      ...expoPreset,
      ...getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native'], 'ios', {
        isReactServer,
      }),
    };
  },
  getAndroidPreset({ isReactServer } = {}) {
    return {
      ...expoPreset,
      ...getPlatformPreset(
        { name: 'Android', color: 'blueBright' },
        ['android', 'native'],
        'android',
        {
          isReactServer,
        }
      ),
    };
  },
};
