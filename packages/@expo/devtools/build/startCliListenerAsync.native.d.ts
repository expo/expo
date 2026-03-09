/**
 * Starts a new imperative listener for cli plugins. This is an alternative to the useDevToolsPlugin
 * hook that is used with devtools. This function is used to avoid having the user to use the hook,
 * and to be able to imperatively communicate over the web socket connections with running apps.
 * We should not run these if we are in production.
 *
 * Returns an object with:
 * - `addMessageListener` — register a handler for a named CLI message
 *
 * Cleanup is handled automatically: previous listeners and clients are torn down when
 * `startCliListenerAsync` is called again with the same plugin name (e.g. on caller
 * hot reload), and when this module itself is hot-reloaded.
 */
export declare const startCliListenerAsync: (pluginName: string) => Promise<{
    addMessageListener: <P extends Record<string, unknown>>(eventName: string, callback: (arg: {
        params: P;
        sendResponseAsync: (message: string) => Promise<void>;
    }) => void) => void;
}>;
//# sourceMappingURL=startCliListenerAsync.native.d.ts.map