// NOTE: VercelRequest/VercelResponse wrap http primitives in Node
// plus some helper inputs and outputs, which we don't need to define
// our interface types
import * as http from 'http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { createRequestHandler as createExpoHandler } from './abstract';
import { createRequestScope } from '../runtime';
import { createNodeEnv } from './environment/node';
import { ScopeDefinition } from '../runtime/scope';
import { createReadableStreamFromReadable } from '../utils/createReadableStreamFromReadable';

export { ExpoError } from './abstract';

export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;

const scopeSymbol = Symbol.for('expoServerScope');

interface VercelContext {
  waitUntil?: (promise: Promise<unknown>) => void;
  [scopeSymbol]?: unknown;
}

const SYMBOL_FOR_REQ_CONTEXT = Symbol.for('@vercel/request-context');

/** @see https://github.com/vercel/vercel/blob/b189b39/packages/functions/src/get-context.ts */
function getContext(): VercelContext {
  const fromSymbol: typeof globalThis & {
    [SYMBOL_FOR_REQ_CONTEXT]?: { get?: () => VercelContext };
  } = globalThis;
  return fromSymbol[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
}

// Vercel already has an async-scoped context in VercelContext, so we can attach
// our scope context to this object
const STORE: ScopeDefinition = {
  getStore: () => getContext()[scopeSymbol],
  run(scope: any, runner: (...args: any[]) => any, ...args: any[]) {
    getContext()[scopeSymbol] = scope;
    return runner(...args);
  },
};

/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export function createRequestHandler(params: { build: string }): RequestHandler {
  const makeRequestAPISetup = (request: Request) => {
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return {
      origin: host ? `${proto}://${host}` : null,
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

export function convertHeaders(requestHeaders: http.IncomingMessage['headers']): Headers {
  const headers = new Headers();
  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }
  return headers;
}

function convertRawHeaders(requestHeaders: readonly string[]): Headers {
  const headers = new Headers();
  for (let index = 0; index < requestHeaders.length; index += 2) {
    headers.append(requestHeaders[index], requestHeaders[index + 1]);
  }
  return headers;
}

export function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request {
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  // doesn't seem to be available on their req object!
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(`${protocol}://${host}${req.url}`);

  // Abort action/loaders once we can no longer write a response
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const init: RequestInit = {
    method: req.method,
    headers: convertRawHeaders(req.rawHeaders),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as RequestInit['signal'],
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // NOTE(@krystofwoldrich) Readable.toWeb breaks the stream in Vercel Functions, unknown why.
    // No error is thrown, but reading the stream like `await req.json()` never resolves.
    init.body = createReadableStreamFromReadable(req);
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

export async function respond(res: http.ServerResponse, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.writeHead(expoRes.status, expoRes.statusText, [...expoRes.headers.entries()].flat());
  if (expoRes.body) {
    await pipeline(Readable.fromWeb(expoRes.body as NodeReadableStream), res);
  } else {
    res.end();
  }
}
