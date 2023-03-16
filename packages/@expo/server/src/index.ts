import fs from 'fs';
import path from 'path';
import { URL } from 'url';

import { ExpoResponse, installGlobals } from './environment';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';
import { getStaticMiddleware } from './static';

// Given build dir
// parse path
// import middleware function

installGlobals();

async function handleRouteHandlerAsync(
  func: any,
  req: ServerRequest,
  res: ServerResponse,
  next: ServerNext
) {
  try {
    // 4. Execute.
    const response = (await func?.(req, res, next)) as ExpoResponse | undefined;

    // 5. Respond
    if (response) {
      if (response.headers) {
        for (const [key, value] of Object.entries(response.headers)) {
          res.setHeader(key, value);
        }
      }

      if (response.status) {
        res.statusCode = response.status;
      }

      if (response.body) {
        res.end(response.body);
      } else {
        res.end();
      }
    } else {
      // TODO: Not sure what to do here yet
      res.statusCode = 404;
      res.end();
    }
  } catch (error) {
    // TODO: Symbolicate error stack
    console.error(error);
    res.statusCode = 500;
    res.end();
  }
}

// TODO: Reuse this for dev as well
export function createRequestHandler(distFolder: string) {
  const statics = path.join(distFolder, 'static');

  const routesManifest = JSON.parse(
    fs.readFileSync(path.join(distFolder, 'routes-manifest.json'), 'utf-8')
  ).map((value: any) => {
    return {
      ...value,
      regex: new RegExp(value.regex),
    };
  });

  const serveStatic = getStaticMiddleware(statics);

  return async function handler(
    request: ServerRequest,
    response: ServerResponse,
    // TODO
    next: ServerNext = function (err) {
      console.error(err);
      response.statusCode = 404;

      return response.end('Not found');
    }
  ) {
    if (!request.url || !request.method) {
      return next();
    }

    const url = new URL(request.url, 'http://acme.dev');

    const sanitizedPathname = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    await new Promise<void>((res, rej) =>
      serveStatic(request, response, (err: any) => (err ? rej(err) : res()))
    );

    for (const route of routesManifest) {
      if (route.regex.test(sanitizedPathname)) {
        // console.log('Using:', route.src, sanitizedPathname, route.regex);
        if (route.src.startsWith('./static/')) {
          return serveStatic(request, response, next);
        }
        const func = require(path.join(distFolder, route.src));

        if (func[request.method]) {
          return handleRouteHandlerAsync(func[request.method], request, response, next);
        } else {
          response.statusCode = 405;
          return response.end('Method not allowed');
        }
      }
    }

    // 404
    response.statusCode = 404;
    return response.end('Not found');
  };
}
