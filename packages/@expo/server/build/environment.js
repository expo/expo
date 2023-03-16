"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoRequest = exports.ExpoResponse = exports.installGlobals = void 0;
const node_fetch_1 = __importStar(require("node-fetch"));
// Ensure these are available for the API Routes.
function installGlobals() {
    // @ts-expect-error
    global.fetch = node_fetch_1.default;
    // @ts-expect-error
    global.Blob = node_fetch_1.Blob;
    // @ts-expect-error
    global.Body = node_fetch_1.Body;
    // @ts-expect-error
    global.Headers = node_fetch_1.Headers;
    // @ts-expect-error
    global.HeaderInit = node_fetch_1.HeaderInit;
    // @ts-expect-error
    global.HeadersInit = node_fetch_1.HeadersInit;
    // @ts-expect-error
    global.Request = node_fetch_1.Request;
    // @ts-expect-error
    global.Response = ExpoResponse;
    // @ts-expect-error
    global.BodyInit = node_fetch_1.BodyInit;
}
exports.installGlobals = installGlobals;
class ExpoResponse extends node_fetch_1.Response {
    // TODO: Drop when we upgrade to node-fetch v3
    static json(data = undefined, init = {}) {
        const body = JSON.stringify(data);
        if (body === undefined) {
            throw new TypeError('data is not JSON serializable');
        }
        // @ts-expect-error
        const headers = new node_fetch_1.Headers(init?.headers);
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
class ExpoRequest extends node_fetch_1.Request {
}
exports.ExpoRequest = ExpoRequest;
