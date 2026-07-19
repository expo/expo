/**
 * The test cases for bare-expo E2E testing. The Maestro flow is generated from this list
 * (see `createMaestroFlowAsync`), so adding or removing an entry is all that's needed; each
 * test must also be registered in `apps/test-suite/TestModules.ts` so the app can run it.
 */
const TESTS = [
  'AppMetrics',
  'Basic',
  // 'Asset',
  // 'FileSystem',
  // 'Font',
  // 'Blur',
  // 'LinearGradient',
  'Constants',
  // 'Contacts',
  'Crypto',
  // 'GLView',
  'Haptics',
  'Localization',
  // 'SecureStore',
  // 'Segment',
  'SQLite',
  'KeepAwake',
  // 'Audio',
  'FileSystem',
  'Fetch',
];

module.exports = { TESTS };
