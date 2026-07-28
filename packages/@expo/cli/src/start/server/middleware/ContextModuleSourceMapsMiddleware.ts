import type { ServerRequest, ServerResponse } from './server.types';

/**
 * Source maps for `require.context` modules aren't supported in the Metro dev server
 * we should intercept the request and return a noop response to prevent Chrome/Metro
 * from erroring out.
 */
export class ContextModuleSourceMapsMiddleware {
  getHandler() {
    return (req: ServerRequest, res: ServerResponse, next: any) => {
      if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
        return next();
      }

      if (req.url.match(/%3Fctx=[\d\w\W]+\.map\?/)) {
        // Return a noop response for the sourcemap
        res.writeHead(200, {
          'Content-Type': 'application/json',
        });
        res.end('{}');
        return;
      }

      next();
    };
  }
}
