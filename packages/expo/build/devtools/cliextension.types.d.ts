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
    };
};
/**
 * Base extension arguments for Expo CLI extensions.
 */
export type ExpoCliExtensionSourceArg = {
    source: 'mcp' | 'cli' | 'unknown';
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
    [K in keyof T]: T[K] & ExpoCliExtensionSourceArg;
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
export type ExpoCliExtensionParameters<T extends ExpoCliExtensionCommandSchema> = ExpoCliExtensionCommands<T> & {
    /**
     * A list of connected Expo applications. Each application is represented by an `ExpoCliApplication` object,
     */
    apps: ExpoCliExtensionAppInfo[];
};
/**
 * Executor function type that ensures type safety between command and args.
 * The args will automatically include the source property.
 */
export type ExpoCliExtensionExecutor<T extends ExpoCliExtensionCommandSchema> = <K extends keyof T>(command: K, args: ExpoCliExtensionArgs<T>[K], apps: ExpoCliExtensionAppInfo[]) => Promise<ExpoCliOutput>;
/**
 * Helper type for commands that don't require additional arguments beyond the base source argument.
 */
export type NoArgs = Record<string, never>;
/**
 * TypeScript types for the output elements of an Expo CLI extension.
 * These elements can be used to format the output of commands executed by the extension.
 * Each element can be either text, an image, or audio.
 * The `data` field for images and audio is expected to be base64-encoded.
 * The `mimeType` field specifies the type of the data, which can vary based on the provider.
 */
export type ExpoCliOutputElement = {
    type: 'text';
    /**
     * Text to display in the output.
     */
    text: string;
    /**
     * Optional URL for the text. This can be used to link to additional information or resources.
     */
    url?: string;
} | {
    type: 'image' /**
     * The base64-encoded image data.
     */;
    data: string;
    /**
     * The URL of the image. This should be a valid file url that points to a file that can be accessed by the client.
     */
    url?: string;
    /**
     * The MIME type of the image. Different providers may support different image types.
     */
    mimeType: string;
} | {
    type: 'audio' /**
     * The base64-encoded audio data.
     */;
    data: string;
    /**
     * The URL of the audio file. This should be a valid file url that points to a file that can be accessed by the client.
     */
    url?: string;
    /**
     * The MIME type of the audio
     */
    mimeType: string;
};
/**
 * TypeScript type for the output of an Expo CLI extension command.
 * This type represents the structure of the output that can be returned by an extension command.
 * It includes an array of output elements, which can be text, images, or audio.
 * @returns Either a structured array of output elements or void (if the tool logs directly to the console)
 */
export type ExpoCliOutput = ExpoCliOutputElement[] | void;
//# sourceMappingURL=cliextension.types.d.ts.map