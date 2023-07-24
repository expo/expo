"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_modules_core_1 = require("expo-modules-core");
if (
// Only during development.
global.__DEV__ &&
    // Disable for SSR
    expo_modules_core_1.Platform.isDOMAvailable &&
    // Disable for non-metro runtimes
    // NOTE(EvanBacon): This can probably be removed in favor of `expo/metro-config` injecting this file.
    global.__METRO_GLOBAL_PREFIX__ != null) {
    require("./setupFastRefresh");
    require("./setupHMR");
    require("./messageSocket");
}
//# sourceMappingURL=effects.js.map