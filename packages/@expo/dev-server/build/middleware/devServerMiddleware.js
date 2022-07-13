"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevServerMiddleware = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const importMetroFromProject_1 = require("../metro/importMetroFromProject");
const middlwareMutations_1 = require("../middlwareMutations");
const clientLogsMiddleware_1 = __importDefault(require("./clientLogsMiddleware"));
const createJsInspectorMiddleware_1 = __importDefault(require("./createJsInspectorMiddleware"));
const remoteDevtoolsCorsMiddleware_1 = require("./remoteDevtoolsCorsMiddleware");
const remoteDevtoolsSecurityHeadersMiddleware_1 = require("./remoteDevtoolsSecurityHeadersMiddleware");
const suppressErrorMiddleware_1 = require("./suppressErrorMiddleware");
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
function createDevServerMiddleware(projectRoot, { watchFolders, port, logger, }) {
    const { createDevServerMiddleware, securityHeadersMiddleware } = (0, importMetroFromProject_1.importCliServerApiFromProject)(projectRoot);
    const { middleware, 
    // @ts-expect-error: Old API
    attachToServer, 
    // New
    debuggerProxyEndpoint, messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints, } = createDevServerMiddleware({
        port,
        watchFolders,
    });
    // securityHeadersMiddleware does not support cross-origin requests for remote devtools to get the sourcemap.
    // We replace with the enhanced version.
    (0, middlwareMutations_1.replaceMiddlewareWith)(middleware, securityHeadersMiddleware, remoteDevtoolsSecurityHeadersMiddleware_1.remoteDevtoolsSecurityHeadersMiddleware);
    middleware.use(remoteDevtoolsCorsMiddleware_1.remoteDevtoolsCorsMiddleware);
    (0, middlwareMutations_1.prependMiddleware)(middleware, suppressErrorMiddleware_1.suppressRemoteDebuggingErrorMiddleware);
    middleware.use(body_parser_1.default.json());
    middleware.use('/logs', (0, clientLogsMiddleware_1.default)(logger));
    middleware.use('/inspector', (0, createJsInspectorMiddleware_1.default)());
    return {
        logger,
        middleware,
        // Old
        attachToServer,
        // New
        debuggerProxyEndpoint,
        messageSocketEndpoint,
        eventsSocketEndpoint,
        websocketEndpoints,
    };
}
exports.createDevServerMiddleware = createDevServerMiddleware;
//# sourceMappingURL=devServerMiddleware.js.map