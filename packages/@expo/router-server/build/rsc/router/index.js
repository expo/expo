"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRouterModule = resolveRouterModule;
/**
 * Resolve the absolute file path of the router module to load. Two modes:
 * full (Expo Router file tree walker) or client-only (no-op).
 *
 * The cli passes the returned path to Metro's SSR loader.
 */
function resolveRouterModule(clientOnly) {
    return clientOnly ? require.resolve('./noopRouter') : require.resolve('./expo-definedRouter');
}
//# sourceMappingURL=index.js.map