'use strict';

const { TestEnvironment: NodeEnvironment } = require('jest-environment-node');

/**
 * Clear mocks exposed on the global scope, but only look at data properties.
 *
 * Since Jest 30.4, `Runtime.resetModules()` (also run during teardown) calls
 * `moduleMocker.clearMocksOnScope(global)`, which reads every enumerable global. Expo installs
 * several globals lazily (`fetch`, `structuredClone`, `__ExpoImportMetaRegistry`, ...) through
 * getters that `require()` their implementation on first access. Reading them after the test has
 * finished throws `You are trying to require a file outside of the scope of the test code`.
 * Accessor properties are skipped here so lazy globals are never evaluated during teardown.
 *
 * @this {import('jest-mock').ModuleMocker}
 * @param {object} scope
 */
function clearMocksOnScope(scope) {
  for (const key of Object.keys(scope)) {
    const descriptor = Object.getOwnPropertyDescriptor(scope, key);
    if (!descriptor || typeof descriptor.get === 'function') {
      continue;
    }
    const value = descriptor.value;
    if (
      value != null &&
      (typeof value === 'object' || typeof value === 'function') &&
      '_isMockFunction' in value &&
      this.isMockFunction(value) &&
      typeof value.mockClear === 'function'
    ) {
      value.mockClear();
    }
  }
}

/**
 * Jest test environment for the native (iOS/Android) presets.
 *
 * Mirrors `@react-native/jest-preset/jest/react-native-env.js`, but resolves `jest-environment-node`
 * from `jest-expo` instead of from `@react-native/jest-preset`. The React Native preset still pins
 * Jest 29 packages, so on Jest 30 its environment would load `jest-environment-node@29`, mixing
 * Jest 29 mocks and fake timers into a Jest 30 runtime (see `clearMocksOnScope is not a function`).
 */
class ReactNativeEnvironment extends NodeEnvironment {
  customExportConditions = ['require', 'react-native'];

  constructor(config, context) {
    super(config, context);
    // Patch the module mocker in place. `NodeEnvironment` already handed this instance to the
    // legacy fake timers, so replacing it would leave timer mocks owned by a mocker the runtime
    // never sees (and `jest.clearAllMocks()` would no longer clear them).
    this.moduleMocker.clearMocksOnScope = clearMocksOnScope;
  }
}

module.exports = ReactNativeEnvironment;
module.exports.TestEnvironment = ReactNativeEnvironment;
