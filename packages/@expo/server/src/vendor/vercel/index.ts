// NOTE: VercelRequest/VercelResponse wrap http primitives in Node
// plus some helper inputs and outputs, which we don't need to define
// our interface types
import * as http from 'http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { createReadableStreamFromReadable } from './utils';
import { createRequestHandler as createExpoHandler } from '../../index';
import {
  getApiRoute,
  getHtml,
  getMiddleware,
  getRoutesManifest,
  handleRouteError,
} from '../../runtime/node';

export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;

/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export function createRequestHandler({ build }: { build: string }): RequestHandler {
  const handleRequest = createExpoHandler({
    getRoutesManifest: getRoutesManifest(build),
    getHtml: getHtml(build),
    getApiRoute: getApiRoute(build),
    getMiddleware: getMiddleware(build),
    handleRouteError: handleRouteError(),
  });

  return async (req, res) => {
    return respond(res, await handleRequest(convertRequest(req, res)));
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
