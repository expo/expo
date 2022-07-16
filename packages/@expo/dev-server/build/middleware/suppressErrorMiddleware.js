"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.suppressRemoteDebuggingErrorMiddleware = suppressRemoteDebuggingErrorMiddleware;

// Middleware to suppress `EISDIR` error when opening javascript inspector in remote debugging.
// A workaround for https://github.com/facebook/react-native/issues/28844
// The root cause is that metro cannot serve sourcemap requests for /debugger-ui/
function suppressRemoteDebuggingErrorMiddleware(req, res, next) {
  var _req$url;

  if ((_req$url = req.url) !== null && _req$url !== void 0 && _req$url.match(/\/debugger-ui\/.+\.map$/)) {
    res.writeHead(404);
    res.end('Sourcemap for /debugger-ui/ is not supported.');
    return;
  }

  next();
}
//# sourceMappingURL=suppressErrorMiddleware.js.map