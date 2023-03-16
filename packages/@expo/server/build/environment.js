"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoRequest = exports.ExpoResponse = exports.installGlobals = void 0;
const node_1 = require("@remix-run/node");
// Ensure these are available for the API Routes.
function installGlobals() {
    (0, node_1.installGlobals)();
    // @ts-expect-error
    global.Request = ExpoRequest;
    // @ts-expect-error
    global.Response = ExpoResponse;
}
exports.installGlobals = installGlobals;
class ExpoResponse extends node_1.Response {
    // TODO: Drop when we upgrade to node-fetch v3
    static json(data = undefined, init = {}) {
        const body = JSON.stringify(data);
        if (body === undefined) {
            throw new TypeError('data is not JSON serializable');
        }
        const headers = new Headers(init?.headers);
        if (!headers.has('content-type')) {
            headers.set('content-type', 'application/json');
        }
        return new ExpoResponse(body, {
            ...init,
            headers,
        });
    }
}
exports.ExpoResponse = ExpoResponse;
class ExpoRequest extends node_1.Request {
}
exports.ExpoRequest = ExpoRequest;
