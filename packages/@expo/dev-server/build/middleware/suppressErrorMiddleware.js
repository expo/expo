"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suppressRemoteDebuggingErrorMiddleware = void 0;
// Middleware to suppress `EISDIR` error when opening javascript inspector in remote debugging.
// A workaround for https://github.com/facebook/react-native/issues/28844
// The root cause is that metro cannot serve sourcemap requests for /debugger-ui/
function suppressRemoteDebuggingErrorMiddleware(req, res, next) {
    var _a;
    if ((_a = req.url) === null || _a === void 0 ? void 0 : _a.match(/\/debugger-ui\/.+\.map$/)) {
        res.writeHead(404);
        res.end('Sourcemap for /debugger-ui/ is not supported.');
        return;
    }
    next();
}
exports.suppressRemoteDebuggingErrorMiddleware = suppressRemoteDebuggingErrorMiddleware;
//# sourceMappingURL=suppressErrorMiddleware.js.map