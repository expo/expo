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

// RSC module map: maps stable IDs (package specifiers) to Metro module getters.
// This is populated by the virtual/rsc.js module which is generated at build time.
// Format: { "react-native-safe-area-context": function() { return __r("node_modules/..."); } }
let rscModuleMap = null;

// Lazy-load the RSC module map when first needed
function getRscModuleMap() {
  if (rscModuleMap === null) {
    try {
      // The virtual/rsc.js module exports the map directly
      rscModuleMap = require('expo/virtual/rsc.js');
    } catch (e) {
      // Module map not available (e.g., dev mode without RSC)
      rscModuleMap = {};
    }
  }
  return rscModuleMap;
}

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
    // First, check if the id is a stable ID that needs translation via the RSC module map.
    // Package specifiers like "react-native-safe-area-context" need to be looked up in the map
    // which provides a getter that calls __r() with the correct path-based Metro module ID.
    const moduleMap = getRscModuleMap();
    if (moduleMap && typeof moduleMap[id] === 'function') {
      return moduleMap[id]();
    }

    // Fall back to direct __r() call for:
    // 1. App-level modules with relative path IDs (e.g., "./../../packages/...")
    // 2. Modules not in the RSC boundary map
    return global[`${__METRO_GLOBAL_PREFIX__}__r`](id);
  } finally {
    // Restore the original error handling.
    if (disableReactNativeMissingModuleHandling) {
      ErrorUtils.reportFatalError = original;
    }
  }
};
