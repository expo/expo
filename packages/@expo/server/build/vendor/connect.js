"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = exports.convertRequest = exports.createRequestHandler = void 0;
const node_1 = require("@remix-run/node");
const express_1 = require("./express");
const __1 = require("..");
/**
 * Returns a request handler for Connect that serves the response using Remix.
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
            // Connect doesn't support async functions, so we have to pass along the
            // error manually using next().
            next(error);
        }
    };
}
exports.createRequestHandler = createRequestHandler;
function convertRequest(req, res) {
    const url = getRequestUrl(req);
    // Abort action/loaders once we can no longer write a response
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const init = {
        method: req.method,
        headers: (0, express_1.convertHeaders)(req.headers),
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
    res.statusCode = expoRes.status;
    for (const [key, value] of expoRes.headers.entries()) {
        res.appendHeader(key, value);
    }
    if (expoRes.body) {
        await (0, node_1.writeReadableStreamToWritable)(expoRes.body, res);
    }
    else {
        res.end();
    }
}
exports.respond = respond;
function getRequestUrl(req) {
    const { host, port } = getRequestHost(req);
    const url = new URL(req.url ?? '', 'http://localhost');
    // see: https://github.com/expressjs/express/blob/4ee853e837dcc6c6c9f93c52278abe775c717fa1/lib/request.js#L306-L324
    // @ts-expect-error - https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51806
    url.protocol = req.socket.encrypted ? 'https:' : 'http:';
    url.hostname = host;
    url.port = port;
    return url;
}
/** @see https://github.com/expressjs/express/blob/4ee853e837dcc6c6c9f93c52278abe775c717fa1/lib/request.js#L427-L450 */
function getRequestHost(req) {
    let header = req.headers['x-forwarded-host'] || req.headers['host'] || '';
    if (Array.isArray(header)) {
        header = header[0];
    }
    const ipv6Offset = header.indexOf(']');
    if (ipv6Offset >= 0) {
        return {
            host: header.substring(0, ipv6Offset),
            port: header.substring(ipv6Offset + 1),
        };
    }
    const [host, port] = header.split(':');
    return { host, port };
}
//# sourceMappingURL=connect.js.map