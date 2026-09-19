'use strict';

const { TestEnvironment: NodeEnvironment } = require('jest-environment-node');
const { ModuleMocker } = require('jest-mock');

/**
 * Module mocker that only inspects data properties when clearing mocks on the global scope.
 *
 * Since Jest 30.4, `Runtime.resetModules()` (also run during teardown) calls
 * `moduleMocker.clearMocksOnScope(global)`, which reads every enumerable global. Expo installs
 * several globals lazily (`fetch`, `structuredClone`, `__ExpoImportMetaRegistry`, ...) through
 * getters that `require()` their implementation on first access. Reading them after the test has
 * finished throws `You are trying to require a file outside of the scope of the test code`.
 * Accessor properties are skipped here so lazy globals are never evaluated during teardown.
 */
class ExpoModuleMocker extends ModuleMocker {
  clearMocksOnScope(scope) {
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
    this.moduleMocker = new ExpoModuleMocker(this.global);
  }
}

module.exports = ReactNativeEnvironment;
module.exports.TestEnvironment = ReactNativeEnvironment;
