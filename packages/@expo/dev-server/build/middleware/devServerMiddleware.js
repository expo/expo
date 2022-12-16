"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDevServerMiddleware = createDevServerMiddleware;
function _bodyParser() {
  const data = _interopRequireDefault(require("body-parser"));
  _bodyParser = function () {
    return data;
  };
  return data;
}
function _importMetroFromProject() {
  const data = require("../metro/importMetroFromProject");
  _importMetroFromProject = function () {
    return data;
  };
  return data;
}
function _middlwareMutations() {
  const data = require("../middlwareMutations");
  _middlwareMutations = function () {
    return data;
  };
  return data;
}
function _clientLogsMiddleware() {
  const data = _interopRequireDefault(require("./clientLogsMiddleware"));
  _clientLogsMiddleware = function () {
    return data;
  };
  return data;
}
function _createJsInspectorMiddleware() {
  const data = _interopRequireDefault(require("./createJsInspectorMiddleware"));
  _createJsInspectorMiddleware = function () {
    return data;
  };
  return data;
}
function _remoteDevtoolsCorsMiddleware() {
  const data = require("./remoteDevtoolsCorsMiddleware");
  _remoteDevtoolsCorsMiddleware = function () {
    return data;
  };
  return data;
}
function _remoteDevtoolsSecurityHeadersMiddleware() {
  const data = require("./remoteDevtoolsSecurityHeadersMiddleware");
  _remoteDevtoolsSecurityHeadersMiddleware = function () {
    return data;
  };
  return data;
}
function _suppressErrorMiddleware() {
  const data = require("./suppressErrorMiddleware");
  _suppressErrorMiddleware = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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
function createDevServerMiddleware(projectRoot, {
  watchFolders,
  port,
  logger
}) {
  const {
    createDevServerMiddleware,
    securityHeadersMiddleware
  } = (0, _importMetroFromProject().importCliServerApiFromProject)(projectRoot);
  const {
    middleware,
    // @ts-expect-error: Old API
    attachToServer,
    // New
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    websocketEndpoints
  } = createDevServerMiddleware({
    port,
    watchFolders
  });

  // securityHeadersMiddleware does not support cross-origin requests for remote devtools to get the sourcemap.
  // We replace with the enhanced version.
  (0, _middlwareMutations().replaceMiddlewareWith)(middleware, securityHeadersMiddleware, _remoteDevtoolsSecurityHeadersMiddleware().remoteDevtoolsSecurityHeadersMiddleware);
  middleware.use(_remoteDevtoolsCorsMiddleware().remoteDevtoolsCorsMiddleware);
  (0, _middlwareMutations().prependMiddleware)(middleware, _suppressErrorMiddleware().suppressRemoteDebuggingErrorMiddleware);
  middleware.use(_bodyParser().default.json());
  middleware.use('/logs', (0, _clientLogsMiddleware().default)(logger));
  middleware.use('/inspector', (0, _createJsInspectorMiddleware().default)());
  return {
    logger,
    middleware,
    // Old
    attachToServer,
    // New
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    websocketEndpoints
  };
}
//# sourceMappingURL=devServerMiddleware.js.map