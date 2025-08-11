"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
exports.convertHeaders = convertHeaders;
exports.convertRequest = convertRequest;
exports.respond = respond;
const node_stream_1 = require("node:stream");
const promises_1 = require("node:stream/promises");
const utils_1 = require("./utils");
const index_1 = require("../../index");
const node_1 = require("../../runtime/node");
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
function createRequestHandler({ build }) {
    const handleRequest = (0, index_1.createRequestHandler)({
        getRoutesManifest: (0, node_1.getRoutesManifest)(build),
        getHtml: (0, node_1.getHtml)(build),
        getApiRoute: (0, node_1.getApiRoute)(build),
        getMiddleware: (0, node_1.getMiddleware)(build),
        handleRouteError: (0, node_1.handleRouteError)(),
    });
    return async (req, res) => {
        return respond(res, await handleRequest(convertRequest(req, res)));
    };
}
function convertHeaders(requestHeaders) {
    const headers = new Headers();
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
function convertRawHeaders(requestHeaders) {
    const headers = new Headers();
    for (let index = 0; index < requestHeaders.length; index += 2) {
        headers.append(requestHeaders[index], requestHeaders[index + 1]);
    }
    return headers;
}
function convertRequest(req, res) {
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    // doesn't seem to be available on their req object!
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(`${protocol}://${host}${req.url}`);
    // Abort action/loaders once we can no longer write a response
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const init = {
        method: req.method,
        headers: convertRawHeaders(req.rawHeaders),
        // Cast until reason/throwIfAborted added
        // https://github.com/mysticatea/abort-controller/issues/36
        signal: controller.signal,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        // NOTE(@krystofwoldrich) Readable.toWeb breaks the stream in Vercel Functions, unknown why.
        // No error is thrown, but reading the stream like `await req.json()` never resolves.
        init.body = (0, utils_1.createReadableStreamFromReadable)(req);
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.writeHead(expoRes.status, expoRes.statusText, [...expoRes.headers.entries()].flat());
    if (expoRes.body) {
        await (0, promises_1.pipeline)(node_stream_1.Readable.fromWeb(expoRes.body), res);
    }
    else {
        res.end();
    }
}
//# sourceMappingURL=index.js.map