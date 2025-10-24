import { AsyncLocalStorage } from 'node:async_hooks';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createRequestHandler as createExpoHandler } from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';
export { ExpoError } from './abstract';
const STORE = new AsyncLocalStorage();
/**
 * Returns a request handler for http that serves the response using Remix.
 */
export function createRequestHandler(params, setup) {
    const run = createNodeRequestScope(STORE, params);
    const nodeEnv = createNodeEnv(params);
    const onRequest = createExpoHandler({
        ...nodeEnv,
        ...setup,
        getRoutesManifest: setup?.getRoutesManifest ?? nodeEnv.getRoutesManifest,
    });
    return async (req, res, next) => {
        if (!req?.url || !req.method) {
            return next();
        }
        try {
            const request = convertRequest(req, res);
            const response = await run(onRequest, request);
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
export function convertRequest(req, res) {
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
        init.body = Readable.toWeb(req);
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
export function convertHeaders(requestHeaders) {
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
export async function respond(res, expoRes) {
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
        await pipeline(Readable.fromWeb(expoRes.body), res);
    }
    else {
        res.end();
    }
}
//# sourceMappingURL=http.js.map