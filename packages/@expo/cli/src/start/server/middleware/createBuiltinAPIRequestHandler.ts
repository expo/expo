import { convertRequest, RequestHandler, respond } from '@expo/server/adapter/http';

import type { ServerNext, ServerRequest, ServerResponse } from './server.types';

export function createBuiltinAPIRequestHandler(
  matchRequest: (request: Request) => boolean,
  handlers: Record<string, (req: Request) => Promise<Response>>
): RequestHandler {
  return createRequestHandler((req) => {
    if (!matchRequest(req)) {
      winterNext();
    }
    const handler = handlers[req.method];
    if (!handler) {
      notAllowed();
    }
    return handler(req);
  });
}

/**
 * Returns a request handler for http that serves the response using Remix.
 */
export function createRequestHandler(
  handleRequest: (request: Request) => Promise<Response>
): RequestHandler {
  return async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
    if (!req?.url || !req.method) {
      return next();
    }
    // These headers (added by other middleware) break the browser preview of RSC.
    res.removeHeader('X-Content-Type-Options');
    res.removeHeader('Cache-Control');
    res.removeHeader('Expires');
    res.removeHeader('Surrogate-Control');

    try {
      const request = convertRequest(req, res);
      const response = await handleRequest(request);
      return await respond(res, response);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return await respond(
          res,
          new Response('Internal Server Error: ' + error.message, {
            status: 500,
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        );
      } else if (error instanceof Response) {
        return await respond(res, error);
      }
      // http doesn't support async functions, so we have to pass along the
      // error manually using next().
      // @ts-expect-error
      next(error);
    }
  };
}

function notAllowed(): never {
  throw new Response('Method Not Allowed', {
    status: 405,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export function winterNext(): never {
  // eslint-disable-next-line no-throw-literal
  throw undefined;
}
