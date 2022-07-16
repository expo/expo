/// <reference types="expo__bunyan" />
/// <reference types="ws" />
import Log from '@expo/bunyan';
/**
 * Extends the default `createDevServerMiddleware` and adds some Expo CLI-specific dev middleware
 * with exception for the manifest middleware which is currently in `xdl`.
 *
 * Adds:
 * - `/logs`: pipe runtime `console` logs to the `props.logger` object.
 * - `/inspector`: launch hermes inspector proxy in chrome.
 * - CORS support for remote devtools
 * - body parser middleware
 *
 * @param props.watchFolders array of directory paths to use with watchman
 * @param props.port port that the dev server will run on
 * @param props.logger bunyan instance that all runtime `console` logs will be piped through.
 *
 * @returns
 */
export declare function createDevServerMiddleware(projectRoot: string, { watchFolders, port, logger, }: {
    watchFolders: readonly string[];
    port: number;
    logger: Log;
}): {
    logger: Log;
    middleware: any;
    attachToServer: any;
    debuggerProxyEndpoint: {
        server: import("ws").Server<import("ws").WebSocket>;
        isDebuggerConnected: () => boolean;
    };
    messageSocketEndpoint: {
        server: import("ws").Server<import("ws").WebSocket>;
        broadcast: (method: string, params?: Record<string, any> | undefined) => void;
    };
    eventsSocketEndpoint: {
        server: import("ws").Server<import("ws").WebSocket>;
        reportEvent: (event: any) => void;
    };
    websocketEndpoints: {
        '/debugger-proxy': import("ws").Server<import("ws").WebSocket>;
        '/message': import("ws").Server<import("ws").WebSocket>;
        '/events': import("ws").Server<import("ws").WebSocket>;
    };
};
