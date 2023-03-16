import send from 'send';
import { URL } from 'url';

import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:server:static') as typeof console.log;

export function getStaticMiddleware(root: string) {
  debug(`hosting:`, root);
  const opts = {
    root,
    extensions: ['html'],
  };
  return (req: ServerRequest, res: ServerResponse, next: any) => {
    if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
      return next();
    }

    // const platform = parsePlatformHeader(req);
    // Currently this is web-only
    // if (platform && platform !== 'web') {
    //   return next();
    // }

    const pathname = new URL(req.url, 'https://acme.dev').pathname;
    if (!pathname) {
      return next();
    }

    debug(`stream:`, pathname);
    const stream = send(req, pathname, opts);

    // add file listener for fallthrough
    let forwardError = false;
    stream.on('file', function onFile() {
      // once file is determined, always forward error
      forwardError = true;
    });

    // forward errors
    stream.on('error', function error(err: any) {
      if (forwardError || !(err.statusCode < 500)) {
        next(err);
        return;
      }

      next();
    });

    // pipe
    stream.pipe(res);
  };
}
