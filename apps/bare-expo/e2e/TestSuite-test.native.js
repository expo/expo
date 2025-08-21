const ALL_TESTS_SPECIFIER = '*';
/**
 * Map paths to test names for the test suite. Asterisk (*) indicates all tests should run.
 * @returns {Record<string, string | string[]>}
 */
function getPackagePathToTestMapping() {
  return {
    '.github/workflows/test-suite.yml': ALL_TESTS_SPECIFIER,
    'apps/native-component-list': ALL_TESTS_SPECIFIER,
    'packages/@expo/': ALL_TESTS_SPECIFIER,
    'packages/babel-preset-expo': ALL_TESTS_SPECIFIER,
    'packages/expo/': ALL_TESTS_SPECIFIER,
    'packages/expo-modules-core/': ALL_TESTS_SPECIFIER,

    'packages/expo-linear-gradient': 'LinearGradient',
    'packages/expo-constants': 'Constants',
    'packages/expo-crypto': 'Crypto',
    'packages/expo-haptics': 'Haptics',
    'packages/expo-localization': 'Localization',
    'packages/expo-sqlite': 'SQLite',
    'packages/expo-keep-awake': 'KeepAwake',
    'packages/expo-file-system': 'FileSystem',
  };
}

const ALWAYS_RUN_TESTS = ['Basic'];

const TESTS = ALWAYS_RUN_TESTS.concat(Object.values(getPackagePathToTestMapping()).flat())
  .filter((it) => it !== ALL_TESTS_SPECIFIER)
  .concat('Fetch');

module.exports = { TESTS, getPackagePathToTestMapping, ALWAYS_RUN_TESTS, ALL_TESTS_SPECIFIER };
