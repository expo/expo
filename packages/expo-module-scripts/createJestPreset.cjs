'use strict';

const { createModulesTransform } = require('./jest-modules-transform.cjs');

// NOTE: Many modules ship as ESM-only but are otherwise ready to be used directly
// We can manually list them here to extend support to them and only transpile to CJS with SWC
const cjsTransformIncludeNames = ['@react-navigation', 'standard-navigation'];

// WARN: Packages here ship Flow/untranspiled source or ESM and assume a transforming bundler
// Anything not listed (e.g. plain-CommonJS deps) runs as-is to keep test transforms fast
const baseTransformIncludeNames = [
  // negative lookahead skip the virtual-store segment
  '\\.pnpm',
  // React Native packages are shipped with Flow source and/or ESM
  'react-native',
  '@react-native/assets-registry',
  '@react-native/js-polyfills',
  '@react-native/normalize-colors',
  '@react-native/virtualized-lists',
  '@react-native/jest-preset',
  '@react-native-masked-view',
  // Google Fonts packages ship ESM
  '@expo-google-fonts',
  // We need to include the above packages that need to be transformed by SWC
  ...cjsTransformIncludeNames,
];

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
  if (!customExportConditions.includes('expo-source')) {
    customExportConditions.push('expo-source');
  }
  // Jest does not support chained presets so we flatten this preset before exporting it
  return {
    ...basePreset,
    clearMocks: true,
    roots: ['<rootDir>/src'],
    transform: {
      // NOTE: Many modules ship as ESM-only but are otherwise ready to be used directly
      // We can manually list them here to extend support to them and only transpile to CJS with SWC
      ...createModulesTransform(cjsTransformIncludeNames),
      ...basePreset.transform,
    },
    transformIgnorePatterns: [
      ...(basePreset.transformIgnorePatterns ?? []),
      `/node_modules/(?!(?:${baseTransformIncludeNames.join('|')}))`,
    ],
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
