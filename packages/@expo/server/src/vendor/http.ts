import * as http from 'http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

import { createRequestHandler as createExpoHandler } from '../index';
import {
  getApiRoute,
  getHtml,
  getMiddleware,
  getRoutesManifest,
  handleRouteError,
} from '../runtime/node';
import type { Manifest } from '../types';

type NextFunction = (err?: any) => void;

export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: NextFunction
) => Promise<void>;

/**
 * Returns a request handler for http that serves the response using Remix.
 */
export function createRequestHandler(
  { build }: { build: string },
  setup: Partial<Parameters<typeof createExpoHandler>[0]> = {}
): RequestHandler {
  let routesManifest: Manifest | null = null;

  const defaultGetRoutesManifest = getRoutesManifest(build);
  const getRoutesManifestCached = async () => {
    let manifest: Manifest | null = null;
    if (setup.getRoutesManifest) {
      // Development
      manifest = await setup.getRoutesManifest();
    } else if (!routesManifest) {
      // Production
      manifest = await defaultGetRoutesManifest();
    }

    if (manifest) {
      routesManifest = manifest;
    }

    return routesManifest;
  };

  const handleRequest = createExpoHandler({
    getRoutesManifest: getRoutesManifestCached,
    getHtml: getHtml(build),
    getApiRoute: getApiRoute(build),
    getMiddleware: getMiddleware(build),
    handleRouteError: handleRouteError(),
    ...setup,
  });

  return async (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => {
    if (!req?.url || !req.method) {
      return next();
    }
    try {
      const request = convertRequest(req, res);

      const response = await handleRequest(request);

      await respond(res, response);
    } catch (error: unknown) {
      // http doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

function convertRawHeaders(requestHeaders: readonly string[]): Headers {
  const headers = new Headers();
  for (let index = 0; index < requestHeaders.length; index += 2) {
    headers.append(requestHeaders[index], requestHeaders[index + 1]);
  }
  return headers;
}

// Convert an http request to an expo request
export function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request {
  const url = new URL(req.url!, `http://${req.headers.host}`);

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

export function convertHeaders(requestHeaders: http.IncomingHttpHeaders): Headers {
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

export async function respond(res: http.ServerResponse, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.statusCode = expoRes.status;

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
