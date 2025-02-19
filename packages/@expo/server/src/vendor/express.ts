import { Readable } from 'node:stream';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';
import type * as express from 'express';

import { createRequestHandler as createExpoHandler } from '../index';

export type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler(
  { build }: { build: string },
  setup?: Parameters<typeof createExpoHandler>[1]
): RequestHandler {
  const handleRequest = createExpoHandler(build, setup);

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req?.url || !req.method) {
      return next();
    }
    try {
      const request = convertRequest(req, res);

      const response = await handleRequest(request);

      await respond(res, response);
    } catch (error: unknown) {
      // Express doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

export function convertHeaders(requestHeaders: express.Request['headers']): Headers {
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

function convertRawHeaders(requestHeaders: express.Request['rawHeaders']): Headers {
  const headers = new Headers();
  for (let index = 0; index < requestHeaders.length; index += 2) {
    headers.append(requestHeaders[index], requestHeaders[index + 1]);
  }
  return headers;
}

export function convertRequest(req: express.Request, res: express.Response): Request {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.url}`);

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
    init.body = Readable.toWeb(req) as ReadableStream;
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

export async function respond(res: express.Response, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.status(expoRes.status);

  if (typeof res.setHeaders === 'function') {
    res.setHeaders(expoRes.headers);
  } else {
    for (const [key, value] of expoRes.headers.entries()) {
      res.appendHeader(key, value);
    }
  }

  if (expoRes.body) {
    await pipeline(Readable.fromWeb(expoRes.body as NodeReadableStream), res);
  } else {
    res.end();
  }
}
