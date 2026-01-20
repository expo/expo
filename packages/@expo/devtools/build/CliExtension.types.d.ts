/**
 * TypeScript types for the Expo DevTools app information. An app is a running Expo React Native application
 * that is connected to the Expo DevTools, which provides debugging and development tools.
 */
export type ExpoCliExtensionAppInfo = {
    /** Unique device ID combined with the page ID */
    id: string;
    /** Information about the underlying CDP implementation, e.g. "React Native Bridgeless [C++ connection]" */
    title: string;
    /** The application ID that is currently running on the device, e.g. "dev.expo.bareexpo" */
    appId: string;
    /** The description of the runtime, e.g. "React Native Bridgeless [C++ connection]" */
    description: string;
    /** The CDP debugger type, which should always be "node" */
    type: 'node';
    /** The internal `devtools://..` URL for the debugger to connect to */
    devtoolsFrontendUrl: string;
    /** The websocket URL for the debugger to connect to */
    webSocketDebuggerUrl: string;
    /**
     * Human-readable device name
     * @since react-native@0.73
     */
    deviceName: string;
    /**
     * React Native specific information, like the unique device ID and native capabilities
     * @since react-native@0.74
     */
    reactNative?: {
        /** The unique device ID */
        logicalDeviceId: string;
        /** All supported native capabilities */
        capabilities: {
            /**
             * Indicates wether this page supports native page reloads - this is the flag we'll be using
             * when filtering the list of available apps for CLI extensions that support reloading
             */
            nativePageReloads: boolean;
        };
    };
};
/**
 * User-defined command schema - each command maps to its specific additional arguments.
 * The base source argument will be automatically added.
 *
 * @example
 * ```typescript
 * type MyCommands = {
 *   list: { filter?: string; limit?: number };
 *   deploy: { environment: string; force?: boolean };
 *   test: {}; // No additional args needed
 * };
 * ```
 */
export type ExpoCliExtensionCommandSchema = Record<string, Record<string, any>>;
/**
 * Transforms a command schema to include the base source arguments
 */
export type ExpoCliExtensionArgs<T extends ExpoCliExtensionCommandSchema> = {
    [K in keyof T]: T[K];
};
/**
 * Union type that creates properly correlated command-args pairs.
 * This ensures that when you have a specific command, the args are typed correctly.
 */
export type ExpoCliExtensionCommands<T extends ExpoCliExtensionCommandSchema> = {
    [K in keyof T]: {
        command: K;
        args: ExpoCliExtensionArgs<T>[K];
    };
}[keyof T];
/**
 * TypeScript types for the Expo CLI extension parameters. This interface defines the structure of the parameters
 * that can be passed to an extension, which includes the command to execute, arguments for the command,
 * and a list of connected Expo applications.
 *
 * The type uses a union approach to ensure that `command` and `args` are properly correlated.
 */
export type ExpoCliExtensionParameters<T extends ExpoCliExtensionCommandSchema> = {
    [K in keyof T]: {
        command: K;
        args: ExpoCliExtensionArgs<T>[K];
        metroServerOrigin: string;
    };
}[keyof T];
/**
 * Executor function type that ensures type safety between command and args.
 * The args will automatically include the source property.
 *
 * Uses a discriminated union callback pattern to enable TypeScript narrowing:
 * when you check `command === 'someCommand'`, the `args` type will be narrowed accordingly.
 */
export type ExpoCliExtensionExecutor<T extends ExpoCliExtensionCommandSchema> = (params: ExpoCliExtensionParameters<T>, console: {
    log: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    uri: (uri: string, altText?: string) => void;
}) => Promise<void>;
//# sourceMappingURL=CliExtension.types.d.ts.map