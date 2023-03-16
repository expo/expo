import {
  Headers,
  writeReadableStreamToWritable,
  RequestInit,
  Response,
  AbortController,
} from '@remix-run/node';
import type * as express from 'express';

import { createRequestHandler as createExpoHandler } from '..';
import { ExpoRequest } from '../environment';

export type RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => Promise<void>;

/**
 * Returns a request handler for Express that serves the response using Remix.
 */
export function createRequestHandler({ build }: { build: string }): RequestHandler {
  const handleRequest = createExpoHandler(build);

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export function convertRequest(req: express.Request, res: express.Response): ExpoRequest {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.url}`);

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
    init.body = req;
  }

  return new ExpoRequest(url.href, init);
}

export async function respond(res: express.Response, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.status(expoRes.status);

  for (let [key, values] of Object.entries(expoRes.headers.raw())) {
    for (let value of values) {
      res.append(key, value);
    }
  }

  if (expoRes.body) {
    await writeReadableStreamToWritable(expoRes.body, res);
  } else {
    res.end();
  }
}
