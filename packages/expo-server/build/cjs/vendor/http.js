"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
exports.convertRequest = convertRequest;
exports.respond = respond;
const node_async_hooks_1 = require("node:async_hooks");
const node_stream_1 = require("node:stream");
const promises_1 = require("node:stream/promises");
const abstract_1 = require("./abstract");
const node_1 = require("./environment/node");
var abstract_2 = require("./abstract");
Object.defineProperty(exports, "ExpoError", { enumerable: true, get: function () { return abstract_2.ExpoError; } });
const STORE = new node_async_hooks_1.AsyncLocalStorage();
/**
 * Returns a request handler for http that serves the response using Remix.
 */
function createRequestHandler(params, setup) {
    const run = (0, node_1.createNodeRequestScope)(STORE, params);
    const onRequest = (0, abstract_1.createRequestHandler)({
        ...(0, node_1.createNodeEnv)(params),
        ...setup,
    });
    async function requestHandler(request) {
        try {
            return await run(onRequest, request);
        }
        catch (error) {
            const handleRouteError = setup?.handleRouteError;
            if (handleRouteError && error != null && typeof error === 'object') {
                try {
                    return await handleRouteError(error);
                }
                catch {
                    // Rethrow original error below
                }
            }
            throw error;
        }
    }
    return async (req, res, next) => {
        if (!req?.url || !req.method) {
            return next();
        }
        try {
            const request = convertRequest(req, res);
            const response = await requestHandler(request);
            await respond(res, response, { signal: request.signal });
        }
        catch (error) {
            // http doesn't support async functions, so we have to pass along the
            // error manually using next().
            next(error);
        }
    };
}
function convertRawHeaders(requestHeaders) {
    const headers = new Headers();
    for (let index = 0; index < requestHeaders.length; index += 2) {
        headers.append(requestHeaders[index], requestHeaders[index + 1]);
    }
    return headers;
}
// Convert an http request to an expo request
function convertRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    // Abort action/loaders once we can no longer write a response or request aborts
    const controller = new AbortController();
    res.once('close', () => controller.abort());
    res.once('error', (err) => controller.abort(err));
    req.once('error', (err) => controller.abort(err));
    const init = {
        method: req.method,
        headers: convertRawHeaders(req.rawHeaders),
        signal: controller.signal,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = node_stream_1.Readable.toWeb(req);
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
/** Assign Headers to a Node.js OutgoingMessage (request) */
const assignOutgoingMessageHeaders = (outgoing, headers) => {
    // Preassemble array headers, mostly only for Set-Cookie
    // We're avoiding `getSetCookie` since support is unclear in Node 18
    const collection = {};
    for (const [key, value] of headers) {
        if (Array.isArray(collection[key])) {
            collection[key].push(value);
        }
        else if (collection[key] != null) {
            collection[key] = [collection[key], value];
        }
        else {
            collection[key] = value;
        }
    }
    // We don't use `setHeaders` due to a Bun bug (Fix: https://github.com/oven-sh/bun/pull/27050)
    for (const key in collection) {
        outgoing.setHeader(key, collection[key]);
    }
};
async function respond(nodeResponse, webResponse, options) {
    if (nodeResponse.writableEnded || nodeResponse.destroyed) {
        return;
    }
    nodeResponse.statusMessage = webResponse.statusText;
    nodeResponse.statusCode = webResponse.status;
    assignOutgoingMessageHeaders(nodeResponse, webResponse.headers);
    if (webResponse.body && !options?.signal?.aborted) {
        const body = node_stream_1.Readable.fromWeb(webResponse.body);
        await (0, promises_1.pipeline)(body, nodeResponse, { signal: options?.signal });
    }
    else {
        nodeResponse.end();
    }
}
//# sourceMappingURL=http.js.map