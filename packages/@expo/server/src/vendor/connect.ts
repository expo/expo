import { writeReadableStreamToWritable, createReadableStreamFromReadable } from '@remix-run/node';
import type * as connect from 'connect';
import type * as http from 'http';

import { convertHeaders } from './express';
import { createRequestHandler as createExpoHandler } from '..';

export type RequestHandler = connect.NextHandleFunction;

/**
 * Returns a request handler for Connect that serves the response using Remix.
 */
export function createRequestHandler(
  { build }: { build: string },
  setup?: Parameters<typeof createExpoHandler>[1]
): RequestHandler {
  const handleRequest = createExpoHandler(build, setup);

  return async (req, res, next) => {
    if (!req?.url || !req.method) {
      return next();
    }

    try {
      const request = convertRequest(req, res);

      const response = await handleRequest(request);

      await respond(res, response);
    } catch (error: unknown) {
      // Connect doesn't support async functions, so we have to pass along the
      // error manually using next().
      next(error);
    }
  };
}

export function convertRequest(req: connect.IncomingMessage, res: http.ServerResponse): Request {
  const url = getRequestUrl(req);

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
    // @ts-expect-error
    init.duplex = 'half';
  }

  return new Request(url.href, init);
}

export async function respond(res: http.ServerResponse, expoRes: Response): Promise<void> {
  res.statusMessage = expoRes.statusText;
  res.statusCode = expoRes.status;

  for (const [key, value] of expoRes.headers.entries()) {
    res.appendHeader(key, value);
  }

  if (expoRes.body) {
    await writeReadableStreamToWritable(expoRes.body, res);
  } else {
    res.end();
  }
}

function getRequestUrl(req: connect.IncomingMessage) {
  const { host, port } = getRequestHost(req);
  const url = new URL(req.url ?? '', 'http://localhost');

  // see: https://github.com/expressjs/express/blob/4ee853e837dcc6c6c9f93c52278abe775c717fa1/lib/request.js#L306-L324
  // @ts-expect-error - https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51806
  url.protocol = req.socket.encrypted ? 'https:' : 'http:';
  url.hostname = host;
  url.port = port;

  return url;
}

/** @see https://github.com/expressjs/express/blob/4ee853e837dcc6c6c9f93c52278abe775c717fa1/lib/request.js#L427-L450 */
function getRequestHost(req: connect.IncomingMessage) {
  let header = req.headers['x-forwarded-host'] || req.headers['host'] || '';
  if (Array.isArray(header)) {
    header = header[0];
  }

  const ipv6Offset = header.indexOf(']');
  if (ipv6Offset >= 0) {
    return {
      host: header.substring(0, ipv6Offset),
      port: header.substring(ipv6Offset + 1),
    };
  }

  const [host, port] = header.split(':');
  return { host, port };
}
