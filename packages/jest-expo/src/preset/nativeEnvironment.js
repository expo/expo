'use strict';

const { TestEnvironment: NodeEnvironment } = require('jest-environment-node');

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
}

module.exports = ReactNativeEnvironment;
module.exports.TestEnvironment = ReactNativeEnvironment;
