import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createRequestHandler as createExpoHandler } from './abstract';
import { createRequestScope } from '../runtime';
import { createNodeEnv } from './environment/node';
import { createReadableStreamFromReadable } from '../utils/createReadableStreamFromReadable';
export { ExpoError } from './abstract';
const scopeSymbol = Symbol.for('expoServerScope');
const SYMBOL_FOR_REQ_CONTEXT = Symbol.for('@vercel/request-context');
/** @see https://github.com/vercel/vercel/blob/b189b39/packages/functions/src/get-context.ts */
function getContext() {
    const fromSymbol = globalThis;
    return fromSymbol[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
}
// Vercel already has an async-scoped context in VercelContext, so we can attach
// our scope context to this object
const STORE = {
    getStore: () => getContext()[scopeSymbol],
    run(scope, runner, ...args) {
        getContext()[scopeSymbol] = scope;
        return runner(...args);
    },
};
/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export function createRequestHandler(params) {
    const makeRequestAPISetup = (request) => {
        const host = request.headers.get('host');
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        return {
            origin: host ? `${proto}://${host}` : 'null',
            // See: https://github.com/vercel/vercel/blob/b189b39/packages/functions/src/get-env.ts#L25C3-L25C13
            environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
            waitUntil: getContext().waitUntil,
        };
    };
    const run = createRequestScope(STORE, makeRequestAPISetup);
    const onRequest = createExpoHandler(createNodeEnv(params));
    return async (req, res) => {
        return respond(res, await run(onRequest, convertRequest(req, res)));
    };
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
function convertRawHeaders(requestHeaders) {
    const headers = new Headers();
    for (let index = 0; index < requestHeaders.length; index += 2) {
        headers.append(requestHeaders[index], requestHeaders[index + 1]);
    }
    return headers;
}
export function convertRequest(req, res) {
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
        init.body = createReadableStreamFromReadable(req);
        init.duplex = 'half';
    }
    return new Request(url.href, init);
}
export async function respond(res, expoRes) {
    res.statusMessage = expoRes.statusText;
    res.writeHead(expoRes.status, expoRes.statusText, [...expoRes.headers.entries()].flat());
    if (expoRes.body) {
        await pipeline(Readable.fromWeb(expoRes.body), res);
    }
    else {
        res.end();
    }
}
//# sourceMappingURL=vercel.js.map