"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = exports.convertRequest = exports.convertHeaders = exports.createRequestHandler = void 0;
const node_1 = require("@remix-run/node");
const __1 = require("..");
/**
 * Returns a request handler for Express that serves the response using Remix.
 */
function createRequestHandler({ build }, setup) {
    const handleRequest = (0, __1.createRequestHandler)(build, setup);
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
            // Express doesn't support async functions, so we have to pass along the
            // error manually using next().
            next(error);
        }
    };
}
exports.createRequestHandler = createRequestHandler;
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
exports.convertHeaders = convertHeaders;
function convertRequest(req, res) {
    const url = new URL(`${req.protocol}://${req.get('host')}${req.url}`);
    // Abort action/loaders once we can no longer write a response
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const init = {
        method: req.method,
        headers: convertHeaders(req.headers),
        // Cast until reason/throwIfAborted added
        // https://github.com/mysticatea/abort-controller/issues/36
        signal: controller.signal,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = (0, node_1.createReadableStreamFromReadable)(req);
        // @ts-expect-error
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
exports.convertRequest = convertRequest;
async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.status(expoRes.status);
    for (const [key, value] of expoRes.headers.entries()) {
        res.append(key, value);
    }
    if (expoRes.body) {
        await (0, node_1.writeReadableStreamToWritable)(expoRes.body, res);
    }
    else {
        res.end();
    }
}
exports.respond = respond;
//# sourceMappingURL=express.js.map