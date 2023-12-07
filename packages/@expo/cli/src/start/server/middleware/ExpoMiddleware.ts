import { parse } from 'url';

import { ServerNext, ServerRequest, ServerResponse } from './server.types';
import * as Log from '../../../log';

/** Base middleware creator for Expo dev servers. */
export abstract class ExpoMiddleware {
  constructor(
    protected projectRoot: string,
    protected supportedPaths: string[]
  ) {}

  /**
   * Returns true when the middleware should handle the incoming server request.
   * Exposed for testing.
   */
  public shouldHandleRequest(req: ServerRequest): boolean {
    if (!req.url) {
      return false;
    }
    const parsed = parse(req.url);
    // Strip the query params
    if (!parsed.pathname) {
      return false;
    }

    return this.supportedPaths.includes(parsed.pathname);
  }

  abstract handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void>;

  /** Create a server middleware handler. */
  public getHandler() {
    const internalMiddleware = async (
      req: ServerRequest,
      res: ServerResponse,
      next: ServerNext
    ) => {
      try {
        return await this.handleRequestAsync(req, res, next);
      } catch (error: any) {
        Log.exception(error);
        // 5xx = Server Error HTTP code
        res.statusCode = 500;
        if (typeof error === 'object' && error !== null) {
          res.end(
            JSON.stringify({
              error: error.toString(),
            })
          );
        } else {
          res.end(`Unexpected error: ${error}`);
        }
      }
    };
    const middleware = async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
      if (!this.shouldHandleRequest(req)) {
        return next();
      }
      return internalMiddleware(req, res, next);
    };

    middleware.internal = internalMiddleware;

    return middleware;
  }
}

export function disableResponseCache(res: ServerResponse): ServerResponse {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Expires', '-1');
  res.setHeader('Pragma', 'no-cache');
  return res;
}
