import type { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';

// Middleware that accepts multiple Access-Control-Allow-Origin for processing *.map.
// This is a hook middleware before metro processing *.map,
// which originally allow only devtools://devtools
export function remoteDevtoolsCorsMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: Error) => void
) {
  if (req.url) {
    const url = parseUrl(req.url);
    const origin = req.headers.origin;
    const isValidOrigin =
      origin &&
      ['devtools://devtools', 'https://chrome-devtools-frontend.appspot.com'].includes(origin);
    if (url.pathname?.endsWith('.map') && origin && isValidOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);

      // Prevent metro overwrite Access-Control-Allow-Origin header
      const setHeader = res.setHeader.bind(res);
      res.setHeader = (key, ...args) => {
        if (key === 'Access-Control-Allow-Origin') {
          return;
        }
        setHeader(key, ...args);
      };
    }
  }
  next();
}
