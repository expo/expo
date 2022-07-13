"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteDevtoolsCorsMiddleware = void 0;
const url_1 = require("url");
// Middleware that accepts multiple Access-Control-Allow-Origin for processing *.map.
// This is a hook middleware before metro processing *.map,
// which originally allow only devtools://devtools
function remoteDevtoolsCorsMiddleware(req, res, next) {
    var _a;
    if (req.url) {
        const url = (0, url_1.parse)(req.url);
        const origin = req.headers.origin;
        const isValidOrigin = origin &&
            ['devtools://devtools', 'https://chrome-devtools-frontend.appspot.com'].includes(origin);
        if (((_a = url.pathname) === null || _a === void 0 ? void 0 : _a.endsWith('.map')) && origin && isValidOrigin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            // Prevent metro overwrite Access-Control-Allow-Origin header
            const setHeader = res.setHeader.bind(res);
            res.setHeader = (key, ...args) => {
                if (key === 'Access-Control-Allow-Origin') {
                    return;
                }
                setHeader(key, ...args);
            };
        }
    }
    next();
}
exports.remoteDevtoolsCorsMiddleware = remoteDevtoolsCorsMiddleware;
//# sourceMappingURL=remoteDevtoolsCorsMiddleware.js.map