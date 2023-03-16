import {
  AbortController as NodeAbortController,
  Headers as NodeHeaders,
  Request as NodeRequest,
  writeReadableStreamToWritable,
} from '@remix-run/node';

import { createRequestHandler as createExpoHandler } from '..';

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  AppLoadContext,
  RequestInit as NodeRequestInit,
  Response as NodeResponse,
} from '@remix-run/node';
/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
export type GetLoadContextFunction = (req: VercelRequest, res: VercelResponse) => AppLoadContext;

export type RequestHandler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * Returns a request handler for Vercel's Node.js runtime that serves the
 * response using Expo.
 */
export function createRequestHandler({ build }: { build: string }): RequestHandler {
  const handleRequest = createExpoHandler(build);

  return async (req, res) => {
    const request = convertRequest(req, res);

    const response = (await handleRequest(request)) as NodeResponse;

    await respond(res, response);
  };
}

export function convertHeaders(requestHeaders: VercelRequest['headers']): NodeHeaders {
  const headers = new NodeHeaders();

  for (const key in requestHeaders) {
    const header = requestHeaders[key]!;
    // set-cookie is an array (maybe others)
    if (Array.isArray(header)) {
      for (const value of header) {
        headers.append(key, value);
      }
    } else {
      headers.append(key, header);
    }
  }

  return headers;
}

export function convertRequest(req: VercelRequest, res: VercelResponse): NodeRequest {
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  // doesn't seem to be available on their req object!
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(`${protocol}://${host}${req.url}`);

  // Abort action/loaders once we can no longer write a response
  const controller = new NodeAbortController();
  res.on('close', () => controller.abort());

  const init: NodeRequestInit = {
    method: req.method,
    headers: convertHeaders(req.headers),
    // Cast until reason/throwIfAborted added
    // https://github.com/mysticatea/abort-controller/issues/36
    signal: controller.signal as NodeRequestInit['signal'],
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
  }

  return new NodeRequest(url.href, init);
}

export async function respond(res: VercelResponse, nodeResponse: NodeResponse): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  const multiValueHeaders = nodeResponse.headers.raw();
  res.writeHead(nodeResponse.status, nodeResponse.statusText, multiValueHeaders);

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
