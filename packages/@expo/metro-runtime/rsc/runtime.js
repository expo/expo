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
// This is populated by:
// 1. The virtual/rsc.js module which is generated at build time (for static boundaries)
// 2. Dynamically via __expo_rsc_register__ when chunks are loaded (for dynamic boundaries)
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

// Dynamic RSC module registration.
// Called by module-only bundles (chunks) to register loaded modules in the RSC map.
// This allows modules that were loaded dynamically to be resolved by __webpack_require__.
globalThis.__expo_rsc_register__ = function (stableId, moduleId) {
  const map = getRscModuleMap();
  if (!map[stableId]) {
    // Capture __r at registration time, not at call time.
    // This ensures we use the correct module registry even if global.__r
    // is replaced by a later bundle load.
    const require = global[`${__METRO_GLOBAL_PREFIX__}__r`];
    map[stableId] = function () {
      return require(moduleId);
    };
  }
};

globalThis.__webpack_require__ = (id) => {
  // RSC module map lookup - ALL stable IDs must be registered at build time
  const moduleMap = getRscModuleMap();
  if (moduleMap && typeof moduleMap[id] === 'function') {
    return moduleMap[id]();
  }

  // No fallback - if the stable ID is not in the module map, it's a build error
  throw new Error(
    `[RSC] Module not found in RSC boundary map: "${id}". ` +
      `This is a build error - the stable ID was not registered during serialization. ` +
      `Check that the module has "use client" or "use server" directive and is properly bundled.`
  );
};
