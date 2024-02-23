"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installGlobals = void 0;
const node_1 = require("@remix-run/node");
function installGlobals() {
    (0, node_1.installGlobals)();
    if (typeof Response.error !== 'function') {
        Response.error = function error() {
            return new Response(null, { status: 500 });
        };
    }
    if (typeof Response.json !== 'function') {
        Response.json = function json(data, init) {
            return new Response(JSON.stringify(data), init);
        };
    }
    if (typeof Response.redirect !== 'function') {
        Response.redirect = function redirect(url, status) {
            if (!status)
                status = 302;
            switch (status) {
                case 301:
                case 302:
                case 303:
                case 307:
                case 308:
                    return new Response(null, {
                        headers: { Location: new URL(url).toString() },
                        status,
                    });
                default:
                    throw new RangeError(`Invalid status code ${status}`);
            }
        };
    }
}
exports.installGlobals = installGlobals;
//# sourceMappingURL=environment.js.map