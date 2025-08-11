"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
exports.convertRequest = convertRequest;
exports.convertHeaders = convertHeaders;
exports.respond = respond;
const node_stream_1 = require("node:stream");
const promises_1 = require("node:stream/promises");
const index_1 = require("../index");
const node_1 = require("../runtime/node");
/**
 * Returns a request handler for http that serves the response using Remix.
 */
function createRequestHandler({ build }, setup = {}) {
    let routesManifest = null;
    const defaultGetRoutesManifest = (0, node_1.getRoutesManifest)(build);
    const getRoutesManifestCached = async () => {
        let manifest = null;
        if (setup.getRoutesManifest) {
            // Development
            manifest = await setup.getRoutesManifest();
        }
        else if (!routesManifest) {
            // Production
            manifest = await defaultGetRoutesManifest();
        }
        if (manifest) {
            routesManifest = manifest;
        }
        return routesManifest;
    };
    const handleRequest = (0, index_1.createRequestHandler)({
        getRoutesManifest: getRoutesManifestCached,
        getHtml: (0, node_1.getHtml)(build),
        getApiRoute: (0, node_1.getApiRoute)(build),
        getMiddleware: (0, node_1.getMiddleware)(build),
        handleRouteError: (0, node_1.handleRouteError)(),
        ...setup,
    });
    return async (req, res, next) => {
        if (!req?.url || !req.method) {
            return next();
        }
        try {
            const request = convertRequest(req, res);
            const response = await handleRequest(request);
            await respond(res, response);
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
async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.statusCode = expoRes.status;
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
//# sourceMappingURL=http.js.map