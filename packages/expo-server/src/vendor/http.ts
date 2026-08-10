import * as http from 'http';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Readable } from 'node:stream';

import {
  createRequestHandler as createExpoHandler,
  type RequestHandlerInput as ExpoRequestHandlerInput,
  type RequestHandlerParams as ExpoRequestHandlerParams,
} from './abstract';
import { createNodeEnv, createNodeRequestScope } from './environment/node';

export { ExpoError } from './abstract';

type NextFunction = (err?: any) => void;

export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: NextFunction
) => Promise<void>;

const STORE = new AsyncLocalStorage();

export interface RequestHandlerParams
  extends ExpoRequestHandlerParams, Partial<ExpoRequestHandlerInput> {
  handleRouteError?(error: Error): Promise<Response>;
}

/**
 * Returns a request handler for http that serves the response using Remix.
 */
export function createRequestHandler(
  params: { build: string; environment?: string | null; isDevelopment?: boolean },
  setup?: Partial<RequestHandlerParams>
): RequestHandler {
  const run = createNodeRequestScope(STORE, params);
  const onRequest = createExpoHandler({
    ...createNodeEnv(params),
    ...setup,
  });

  async function requestHandler(request: Request): Promise<Response> {
    try {
      return await run(onRequest, request);
    } catch (error) {
      const handleRouteError = setup?.handleRouteError;
      if (handleRouteError && error != null && typeof error === 'object') {
        try {
          return await handleRouteError(error as Error);
        } catch {
          // Rethrow original error below
        }
      }
      throw error;
    }
  }

  return async (req: http.IncomingMessage, res: http.ServerResponse, next: NextFunction) => {
    if (!req?.url || !req.method) {
      return next();
    }
    try {
      const request = convertRequest(req, res);
      const response = await requestHandler(request);
      await respond(res, response, { signal: request.signal });
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
    const name = requestHeaders[index];
    const value = requestHeaders[index + 1];
    if (name != null && value != null) {
      headers.append(name, value);
    }
  }
  return headers;
}

// Convert an http request to an expo request
export function convertRequest(req: http.IncomingMessage, res: http.ServerResponse): Request {
  const proto = 'encrypted' in req.socket && !!req.socket.encrypted ? 'https' : 'http';
  const url = new URL(req.url!, `${proto}://${req.headers.host}`);

  // Abort action/loaders once we can no longer write a response or request aborts
  const controller = new AbortController();

  res.once('close', () => {
    if (!res.writableEnded) {
      if (!controller.signal.aborted) {
        controller.abort();
      }
      if (!req.destroyed) {
        req.destroy();
      }
    }
  });

  res.once('error', (err) => {
    if (err.name !== 'AbortError' && !controller.signal.aborted) {
      controller.abort(err);
    }
  });

  req.once('error', (err) => {
    if (err.name !== 'AbortError' && !controller.signal.aborted) {
      controller.abort(err);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers: convertRawHeaders(req.rawHeaders),
    signal: controller.signal,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = Readable.toWeb(req) as ReadableStream;
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

/** Assign Headers to a Node.js OutgoingMessage (request) */
const assignOutgoingMessageHeaders = (outgoing: http.OutgoingMessage, headers: Headers) => {
  // Preassemble array headers, mostly only for Set-Cookie
  // We're avoiding `getSetCookie` since support is unclear in Node 18
  const collection: Record<string, string | string[]> = {};
  for (const [key, value] of headers) {
    if (Array.isArray(collection[key])) {
      collection[key].push(value);
    } else if (collection[key] != null) {
      collection[key] = [collection[key], value];
    } else {
      collection[key] = value;
    }
  }
  // We don't use `setHeaders` due to a Bun bug (Fix: https://github.com/oven-sh/bun/pull/27050)
  for (const key in collection) {
    if (collection[key] != null) {
      outgoing.setHeader(key, collection[key]);
    }
  }
};

interface RespondOptions {
  signal?: AbortSignal;
}

export async function respond(
  nodeResponse: http.ServerResponse,
  webResponse: Response,
  options?: RespondOptions
): Promise<void> {
  if (nodeResponse.writableEnded || nodeResponse.destroyed) {
    return;
  }

  let _cancelled = false;
  nodeResponse.statusMessage = webResponse.statusText;
  nodeResponse.statusCode = webResponse.status;
  assignOutgoingMessageHeaders(nodeResponse, webResponse.headers);

  if (!webResponse.body || options?.signal?.aborted) {
    nodeResponse.end();
    return;
  } else if (nodeResponse.destroyed) {
    return;
  }

  const reader = webResponse.body.getReader();

  const cancelBody = (reason?: unknown) => {
    if (!_cancelled) {
      _cancelled = true;
      (void reader.cancel(reason).catch(() => {/*noop*/}));
    }
  };

  const onAbort = () => {
    const reason = options?.signal?.reason;
    cancelBody(reason);
    if (!nodeResponse.destroyed) {
      nodeResponse.destroy(reason instanceof Error ? reason : undefined);
    }
  };

  const onClose = () => cancelBody();

  try {
    nodeResponse.once('close', onClose);
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    while (!_cancelled) {
      const result = await reader.read();
      if (result.done) {
        break;
      } else if (!nodeResponse.write(result.value)) {
        await advanceResponse(nodeResponse);
      }
    }
  } catch (error) {
    if (nodeResponse.headersSent && !nodeResponse.destroyed) {
      nodeResponse.destroy(error instanceof Error ? error : undefined);
    }
    throw error;
  } finally {
    nodeResponse.off('close', onClose);
    options?.signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }

  if (!_cancelled && !nodeResponse.destroyed) {
    nodeResponse.end();
  }
}

function advanceResponse(response: http.ServerResponse): Promise<void> | void {
  if (!response.destroyed) {
    return new Promise<void>((resolve) => {
      function done() {
        response.off('close', done);
        response.off('drain', done);
        resolve();
      }
      response.once('close', done);
      response.once('drain', done);
    });
  }
}
