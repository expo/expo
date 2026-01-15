/**
 * Starts a new imperative listener for cli plugins. This is an alternative to the useDevToolsPlugin
 * hook that is used with devtools. This function is used to avoid having the user to use the hook,
 * and to be able to imperatively communicate over the web socket connections with running apps.
 * We should not run these if we are in production - but we should run in development
 * and when in a development client built in release mode with EAS.
 * @returns
 */
export declare const startCliListenerAsync: (pluginName: string) => Promise<{
    addMessageListener: <P extends Record<string, string>>(eventName: string, callback: (arg: {
        params: P;
        sendResponseAsync: (message: string) => Promise<void>;
    }) => void) => void;
    sendMessageAsync: (eventName: string, message: string) => Promise<void>;
}>;
//# sourceMappingURL=startCliListenerAsync.native.d.ts.map