/// <reference types="expo__bunyan" />
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
        server: any;
        isDebuggerConnected: () => boolean;
    };
    messageSocketEndpoint: {
        server: any;
        broadcast: (method: string, params?: Record<string, any> | undefined) => void;
    };
    eventsSocketEndpoint: {
        server: any;
        reportEvent: (event: any) => void;
    };
    websocketEndpoints: {
        '/debugger-proxy': any;
        '/message': any;
        '/events': any;
    };
};
