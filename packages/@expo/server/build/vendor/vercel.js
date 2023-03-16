"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = exports.convertRequest = exports.convertHeaders = exports.createRequestHandler = void 0;
const node_1 = require("@remix-run/node");
const __1 = require("..");
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Expo.
 */
function createRequestHandler({ build }) {
    const handleRequest = (0, __1.createRequestHandler)(build);
    return async (req, res) => {
        const request = convertRequest(req, res);
        const response = (await handleRequest(request));
        await respond(res, response);
    };
}
exports.createRequestHandler = createRequestHandler;
function convertHeaders(requestHeaders) {
    const headers = new node_1.Headers();
    for (const key in requestHeaders) {
        const header = requestHeaders[key];
        // set-cookie is an array (maybe others)
        if (Array.isArray(header)) {
            for (const value of header) {
                headers.append(key, value);
            }
        }
        else {
            headers.append(key, header);
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
    return new node_1.Request(url.href, init);
}
exports.convertRequest = convertRequest;
async function respond(res, nodeResponse) {
    res.statusMessage = nodeResponse.statusText;
    const multiValueHeaders = nodeResponse.headers.raw();
    res.writeHead(nodeResponse.status, nodeResponse.statusText, multiValueHeaders);
    if (nodeResponse.body) {
        await (0, node_1.writeReadableStreamToWritable)(nodeResponse.body, res);
    }
    else {
        res.end();
    }
}
exports.respond = respond;
