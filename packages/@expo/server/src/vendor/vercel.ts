// NOTE: VercelRequest/VercelResponse wrap http primitives in Node
// plus some helper inputs and outputs, which we don't need to define
// our interface types
import { writeReadableStreamToWritable, createReadableStreamFromReadable } from '@remix-run/node';
import * as http from 'http';

import { createRequestHandler as createExpoHandler } from '..';

export type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;

/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Remix.
 */
export function createRequestHandler({ build }: { build: string }): RequestHandler {
  const handleRequest = createExpoHandler(build);

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
    headers: convertHeaders(req.headers),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as RequestInit['signal'],
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = createReadableStreamFromReadable(req);
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

export async function respond(res: http.ServerResponse, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.writeHead(expoRes.status, expoRes.statusText, [...expoRes.headers.entries()].flat());

  if (expoRes.body) {
    await writeReadableStreamToWritable(expoRes.body, res);
  } else {
    res.end();
  }
}
