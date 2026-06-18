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

function _createJestPreset(basePreset) {
  const customExportConditions =
    basePreset.testEnvironmentOptions?.customExportConditions?.slice() ?? [];
  if (!customExportConditions.includes('source')) {
    customExportConditions.push('source');
  }
  // Jest does not support chained presets so we flatten this preset before exporting it
  return {
    ...basePreset,
    clearMocks: true,
    roots: ['<rootDir>/src'],
    testEnvironmentOptions: {
      ...basePreset.testEnvironmentOptions,
      customExportConditions,
    },
    moduleNameMapper: {
      // Source exports can contain TypeScript files that use explicit `.js`
      // extensions for runtime ESM compatibility.
      '^(\\.{1,2}/.*)\\.js$': '$1',
      ...basePreset.moduleNameMapper,
    },
    // Add the React 19 workaround
    setupFiles: [...basePreset.setupFiles, require.resolve('./jest-setup-react-19.cjs')],
  };
}
