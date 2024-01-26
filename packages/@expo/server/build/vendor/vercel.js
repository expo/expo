"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = exports.convertRequest = exports.convertHeaders = exports.createRequestHandler = void 0;
// NOTE: VercelRequest/VercelResponse wrap http primitives in Node
// plus some helper inputs and outputs, which we don't need to define
// our interface types
const node_1 = require("@remix-run/node");
const __1 = require("..");
const environment_1 = require("../environment");
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
function createRequestHandler({ build }) {
    const handleRequest = (0, __1.createRequestHandler)(build);
    return async (req, res) => {
        return respond(res, await handleRequest(convertRequest(req, res)));
    };
}
exports.createRequestHandler = createRequestHandler;
function convertHeaders(requestHeaders) {
    const headers = new node_1.Headers();
    for (const [key, values] of Object.entries(requestHeaders)) {
        if (values) {
            if (Array.isArray(values)) {
                for (const value of values) {
                    headers.append(key, value);
                }
            }
            else {
                headers.set(key, values);
            }
        }
    }
    return headers;
}
exports.convertHeaders = convertHeaders;
function convertRequest(req, res) {
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    // doesn't seem to be available on their req object!
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(`${protocol}://${host}${req.url}`);
    // Abort action/loaders once we can no longer write a response
    const controller = new node_1.AbortController();
    res.on('close', () => controller.abort());
    const init = {
        method: req.method,
        headers: convertHeaders(req.headers),
        // Cast until reason/throwIfAborted added
        // https://github.com/mysticatea/abort-controller/issues/36
        signal: controller.signal,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = req;
    }
    return new environment_1.ExpoRequest(url.href, init);
}
exports.convertRequest = convertRequest;
async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.writeHead(expoRes.status, expoRes.statusText, expoRes.headers.raw());
    if (expoRes.body) {
        await (0, node_1.writeReadableStreamToWritable)(expoRes.body, res);
    }
    else {
        res.end();
    }
}
exports.respond = respond;
//# sourceMappingURL=vercel.js.map