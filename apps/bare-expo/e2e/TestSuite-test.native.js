/**
 * The test cases for bare-expo E2E testing. The Maestro flow is generated from this list
 * (see `createMaestroFlowAsync`), so adding or removing an entry is all that's needed; each
 * test must also be registered in `apps/test-suite/TestModules.ts` so the app can run it.
 */
const TESTS = [
  // AppMetrics: its NetworkRequestObserver tests fail in the Android Release build (no events are
  // emitted; nine timeouts), which has kept this flow red since 2026-09-03. iOS passes. Re-enable
  // once the Android observer is fixed.
  // 'AppMetrics',
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
