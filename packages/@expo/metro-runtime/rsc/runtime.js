/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// React Native's error handling is full of bugs which cause the app to crash in production.
// We'll disable their handling in production native builds to ensure missing modules are shown to the user.
const disableReactNativeMissingModuleHandling =
  !__DEV__ && (process.env.EXPO_OS !== 'web' || typeof window === 'undefined');

globalThis.__webpack_chunk_load__ = (id) => {
  return global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`](id);
};

globalThis.__webpack_require__ = (id) => {
  // This logic can be tested by running a production iOS build without virtual client boundaries. This will result in all split chunks being missing and
  // errors being thrown on RSC load.

  const original = ErrorUtils.reportFatalError;
  if (disableReactNativeMissingModuleHandling) {
    ErrorUtils.reportFatalError = (err) => {
      // Throw the error so the __r function exits as expected. The error will then be caught by the nearest error boundary.
      throw err;
    };
  }
  try {
    return global[`${__METRO_GLOBAL_PREFIX__}__r`](id);
  } finally {
    // Restore the original error handling.
    if (disableReactNativeMissingModuleHandling) {
      ErrorUtils.reportFatalError = original;
    }
  }
};
