"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
exports.convertHeaders = convertHeaders;
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
 * Returns a request handler for Express that serves the response using Remix.
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
            await respond(res, response);
        }
        catch (error) {
            // Express doesn't support async functions, so we have to pass along the
            // error manually using next().
            next(error);
        }
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
    const url = new URL(`${req.protocol}://${req.get('host')}${req.url}`);
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
        init.body = node_stream_1.Readable.toWeb(req);
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.status(expoRes.status);
    if (typeof res.setHeaders === 'function') {
        res.setHeaders(expoRes.headers);
    }
    else {
        for (const [key, value] of expoRes.headers.entries()) {
            res.appendHeader(key, value);
        }
    }
    if (expoRes.body) {
        await (0, promises_1.pipeline)(node_stream_1.Readable.fromWeb(expoRes.body), res);
    }
    else {
        res.end();
    }
}
//# sourceMappingURL=express.js.map