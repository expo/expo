'use strict';

module.exports = function createJestPreset(basePreset) {
  // Explicitly catch and log errors since Jest sometimes suppresses error messages
  try {
    return _createJestPreset(basePreset);
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
    throw e;
  }
};

function getPlatformFromPreset(basePreset) {
  const haste = basePreset.haste || {};

  if (haste && haste.defaultPlatform) {
    if (!haste.defaultPlatform) {
      throw new Error(
        'Jest haste.defaultPlatform is not defined. Cannot determine the platform to bundle for.'
      );
    }
  }

  if (haste.defaultPlatform === 'node') {
    return { platform: 'web', isServer: true };
  } else if (haste.defaultPlatform === 'web') {
    if (basePreset.testEnvironment && basePreset.testEnvironment === 'node') {
      return { platform: 'web', isServer: true };
    } else {
      return { platform: 'web', isServer: false };
    }
  } else {
    return {
      platform: haste.defaultPlatform,
      // TODO: Account for react-server in the future.
      isServer: false,
    };
  }
}

function _createJestPreset(basePreset) {
  const { platform, isServer } = getPlatformFromPreset(basePreset);
  // Jest does not support chained presets so we flatten this preset before exporting it
  return {
    ...basePreset,
    clearMocks: true,
    roots: ['<rootDir>/src'],
    transform: {
      ...basePreset.transform,
      '^.+\\.tsx?$': [
        'ts-jest',
        {
          babelConfig: {
            // NOTE: Assuming the default babel options will be enough to find the correct Babel config for testing.
            // https://babeljs.io/docs/options
            // We only need to set the caller so `babel-preset-expo` knows how to compile the project.
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
          ...basePreset.transform?.['^.+\\.tsx?$']?.[1],
          tsconfig: {
            module: 'esnext',
            moduleResolution: 'bundler',
          },
        },
      ],
    },
    // Add the React 19 workaround
    setupFiles: [...basePreset.setupFiles, require.resolve('./jest-setup-react-19.cjs')],
  };
}
