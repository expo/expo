import { parsePlatformHeader } from './resolvePlatform';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:metro:historyFallback') as typeof console.log;

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const PAGES_LIST_JSON_URL = '/json';
const PAGES_LIST_JSON_URL_2 = '/json/list';
const PAGES_LIST_JSON_VERSION_URL = '/json/version';

export function isInspectorProxyRequest(req: ServerRequest) {
  const ua = req.headers['user-agent'];
  const url = req.url;

  // This check is very fragile but it enables websites to use any of the
  // endpoints below without triggering the inspector proxy.
  if (!url || (ua && !ua.includes('node-fetch'))) {
    // This optimizes for the inspector working over the endpoint being available on web.
    // Web is less fragile.
    return false;
  }

  return [
    WS_DEVICE_URL,
    WS_DEBUGGER_URL,
    PAGES_LIST_JSON_URL,
    PAGES_LIST_JSON_URL_2,
    PAGES_LIST_JSON_VERSION_URL,
  ].includes(url);
}

/**
 * Create a web-only middleware which redirects to the index middleware without losing the path component.
 * This is useful for things like React Navigation which need to render the index.html and then direct the user in-memory.
 */
export class HistoryFallbackMiddleware {
  constructor(
    private indexMiddleware: (
      req: ServerRequest,
      res: ServerResponse,
      next: ServerNext
    ) => Promise<void>
  ) {}
  getHandler() {
    return (req: ServerRequest, res: ServerResponse, next: any) => {
      const platform = parsePlatformHeader(req);

      if (!platform || platform === 'web') {
        if (isInspectorProxyRequest(req)) {
          debug('Inspector proxy request:', req.url, 'UA:', req.headers['user-agent']);
          return next();
        }
        // Redirect unknown to the manifest handler while preserving the path.
        // This implements the HTML5 history fallback API.
        return this.indexMiddleware(req, res, next);
      }

      return next();
    };
  }
}
