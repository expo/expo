import type { ExpoConfig } from '@expo/config';

import type { ServerRequest, ServerResponse } from './server.types';

const DEFAULT_ALLOWED_CORS_HOSTS = [
  'chrome-devtools-frontend.appspot.com', // Support remote Chrome DevTools frontend
  'devtools', // Support local Chrome DevTools `devtools://devtools`
];

export const _isLocalHostname = (hostname: string) => {
  if (hostname === 'localhost') {
    return true;
  }
  let maybeIp = hostname;
  const ipv6To4Prefix = '::ffff:';
  if (maybeIp.startsWith(ipv6To4Prefix)) {
    maybeIp = maybeIp.slice(ipv6To4Prefix.length);
  }
  if (maybeIp === '::1') {
    return true;
  } else if (/^127(?:.\d+){3}$/.test(maybeIp)) {
    return maybeIp.split('.').every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  } else {
    return false;
  }
};

export function createCorsMiddleware(exp: ExpoConfig) {
  const allowedHosts = [...DEFAULT_ALLOWED_CORS_HOSTS];
  // Support for expo-router API routes
  if (exp.extra?.router?.headOrigin) {
    allowedHosts.push(new URL(exp.extra.router.headOrigin).host);
  }
  if (exp.extra?.router?.origin) {
    allowedHosts.push(new URL(exp.extra.router.origin).host);
  }

  return (req: ServerRequest, res: ServerResponse, next: (err?: Error) => void) => {
    if (typeof req.headers.origin === 'string') {
      const { host, hostname, origin } = new URL(req.headers.origin);
      const isSameOrigin = host === req.headers.host;
      const isLocalhost = _isLocalHostname(hostname);
      const isAllowedHost = allowedHosts.includes(host) || isLocalhost;
      if (!isSameOrigin && !isAllowedHost) {
        next(
          new Error(
            `Unauthorized request from ${req.headers.origin}. ` +
              'This may happen because of a conflicting browser extension to intercept HTTP requests. ' +
              'Disable browser extensions or use incognito mode and try again.'
          )
        );
        return;
      } else if (!isLocalhost && isAllowedHost) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      }

      maybePreventMetroResetCorsHeader(req, res);
    }

    // Block MIME-type sniffing.
    res.setHeader('X-Content-Type-Options', 'nosniff');

    next();
  };
}

// When accessing source maps,
// metro will overwrite the `Access-Control-Allow-Origin` header with hardcoded `devtools://devtools` value.
// https://github.com/facebook/metro/blob/a7f8955e6d2424b0d5f73d4bcdaf22560e1d5f27/packages/metro/src/Server.js#L540
// This is a workaround to prevent this behavior.
function maybePreventMetroResetCorsHeader(req: ServerRequest, res: ServerResponse) {
  const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : '';
  if (pathname.endsWith('.map')) {
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (key, ...args) => {
      if (key !== 'Access-Control-Allow-Origin') {
        setHeader(key, ...args);
      }
      return res;
    };
  }
}
