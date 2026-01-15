/**
 * Dummy implementation of the `startDevToolsPluginListenerAsync` function for platforms
 * that do not support it, such as web or non-native environments.
 */
export declare const startCliListenerAsync: (_pluginName: string) => Promise<{
    addMessageListener: <P extends Record<string, string>>(eventName: string, callback: (arg: {
        params: P;
        sendResponseAsync: (message: string) => Promise<void>;
    }) => void) => void;
    sendMessageAsync: (eventName: string, message: string) => Promise<void>;
}>;
//# sourceMappingURL=startCliListenerAsync.d.ts.map