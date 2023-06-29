import { parsePlatformHeader } from './resolvePlatform';
import { ServerMiddleware, ServerRequest } from './server.types';

const debug = require('debug')('expo:start:server:metro:inspectorMiddleware') as typeof console.log;

const WS_DEVICE_URL = '/inspector/device';
const WS_DEBUGGER_URL = '/inspector/debug';
const PAGES_LIST_JSON_URL = '/json';
const PAGES_LIST_JSON_URL_2 = '/json/list';
const PAGES_LIST_JSON_VERSION_URL = '/json/version';

/** Exposed for testing */
export function isInspectorRequest(req: ServerRequest) {
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

/** Exposed for testing */
export function isWebRequest(req: ServerRequest) {
  const platform = parsePlatformHeader(req);
  return !platform || platform === 'web';
}

/**
 * Wrap any middleware in a check to avoid capturing inspector proxy requests.
 * When such a request is detected, the middleware will not be called.
 */
export function withoutInspectorRequests(middleware: ServerMiddleware): ServerMiddleware {
  return async (req, res, next) => {
    if (isWebRequest(req) && isInspectorRequest(req)) {
      debug('Inspector request:', req.url, 'UA:', req.headers['user-agent']);
      return next();
    }

    return await middleware(req, res, next);
  };
}
