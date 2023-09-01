"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Only during development.
if (process.env.NODE_ENV !== 'production') {
    if (
    // Disable for SSR
    typeof window !== 'undefined' &&
        // Disable for non-metro runtimes
        // NOTE(EvanBacon): This can probably be removed in favor of `expo/metro-config` injecting this file.
        global.__METRO_GLOBAL_PREFIX__ != null) {
        require('./setupFastRefresh');
        require('./setupHMR');
        require('./messageSocket');
    }
}
//# sourceMappingURL=effects.js.map