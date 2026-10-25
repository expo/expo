'use strict';

const { getBareExtensions } = require('./extensions');
const { withWatchPlugins } = require('./withWatchPlugins');
const expoPreset = require('../jest-preset');
const { resolveBabelOptions } = require('../src/resolveBabelOptions');

const babelJestPath = require.resolve('babel-jest');

function isBabelJest(transformer) {
  return transformer === 'babel-jest' || transformer === babelJestPath;
}

function getUpstreamBabelJest(transform) {
  const upstreamBabelJest = Object.keys(transform).find((key) =>
    Array.isArray(transform[key]) ? isBabelJest(transform[key][0]) : isBabelJest(transform[key])
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
  const babelJestOptions = resolveBabelOptions(process.cwd());

  if (isReactServer && displayOptions && displayOptions.name) {
    displayOptions.name = `rsc/${extensions[0]}`;
  }

  const preset = withWatchPlugins({
    transform: {
      ...expoPreset.transform,
      [upstreamBabelJest]: [
        babelJestPath,
        {
          ...babelJestOptions,
          caller: {
            name: 'metro',
            bundler: 'jest',
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

  preset.testEnvironmentOptions ??= {};
  if (!preset.testEnvironmentOptions.customExportConditions) {
    preset.testEnvironmentOptions.customExportConditions = isServer
      ? ['node', 'require']
      : platform === 'web'
        ? ['browser']
        : ['react-native'];
  }
  preset.moduleNameMapper = {
    // See the note in `../jest-preset.js`: mapped targets must be absolute paths on Jest 30.
    '^react-native/asset-registry$': expoPreset.moduleNameMapper['^react-native/asset-registry$'],
    '^react-native/unstable-internals-do-not-use$':
      expoPreset.moduleNameMapper['^react-native/unstable-internals-do-not-use$'],
    ...preset.moduleNameMapper,
  };

  if (isServer) {
    preset.testEnvironment = 'node';
  }

  if (isReactServer) {
    preset.testEnvironment = 'node';
    if (!preset.setupFiles) {
      preset.setupFiles = [];
    }
    preset.setupFiles.push(require.resolve('../src/preset/setup-rsc.js'));

    // Setup custom expect matchers
    preset.setupFilesAfterEnv ??= [];
    preset.setupFilesAfterEnv.push(require.resolve('../src/rsc-expect.ts'));

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

// `getPlatformPreset` builds its own `moduleNameMapper` from scratch, so spreading it over the
// base preset drops the mappers that the base preset defines. Those mappers are required: since
// React Native 0.87 `jest/setup.js` mocks `react-native/setup-env`, which is only reachable
// through the `^react-native/setup-env$` alias, and `withTypescriptMapping` adds the aliases from
// the project's `tsconfig.json` `paths`. Merge them back for every platform preset, keeping the
// platform mappers last so platform-specific entries still win.
function withBaseModuleNameMapper(basePreset, platformPreset) {
  return {
    ...basePreset,
    ...platformPreset,
    moduleNameMapper: {
      ...basePreset.moduleNameMapper,
      ...platformPreset.moduleNameMapper,
    },
  };
}

module.exports = {
  getWebPreset({ isReactServer } = {}) {
    return withBaseModuleNameMapper(
      { ...getBaseWebPreset(), testEnvironment: 'jsdom' },
      getPlatformPreset({ name: 'Web', color: 'magenta' }, ['web'], 'web', {
        isReactServer,
      })
    );
  },
  getNodePreset() {
    return withBaseModuleNameMapper(
      getBaseWebPreset(),
      getPlatformPreset({ name: 'Node', color: 'cyan' }, ['node', 'web'], 'web', {
        isServer: true,
      })
    );
  },
  getIOSPreset({ isReactServer } = {}) {
    return withBaseModuleNameMapper(
      expoPreset,
      getPlatformPreset({ name: 'iOS', color: 'white' }, ['ios', 'native'], 'ios', {
        isReactServer,
      })
    );
  },
  getAndroidPreset({ isReactServer } = {}) {
    return withBaseModuleNameMapper(
      expoPreset,
      getPlatformPreset(
        { name: 'Android', color: 'blueBright' },
        ['android', 'native'],
        'android',
        {
          isReactServer,
        }
      )
    );
  },
};
