import send from 'send';
import { URL } from 'url';

import { ExpoRequest, ExpoResponse } from './environment';

const debug = require('debug')('expo:server:static') as typeof console.log;

export function getStaticMiddleware(root: string) {
  debug(`hosting:`, root);
  const opts = {
    root,
    extensions: ['html'],
  };
  return (url: URL, req: ExpoRequest) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return null;
    }

    // TODO: Use this as the rsc endpoint on native requests

    // const platform = parsePlatformHeader(req);
    // Currently this is web-only
    // if (platform && platform !== 'web') {
    //   return next();
    // }

    const pathname = url.pathname;
    if (!pathname) {
      return null;
    }

    debug(`stream:`, pathname);
    const stream = send(req, pathname, opts);

    // add file listener for fallthrough
    let forwardError = false;
    stream.on('file', function onFile() {
      // once file is determined, always forward error
      forwardError = true;
    });

    return new Promise<ExpoResponse>((resolve, reject) => {
      // forward errors
      stream.on('error', function error(err: any) {
        if (forwardError || !(err.statusCode < 500)) {
          reject(err);
          return;
        }

        resolve(res);
      });

      const res = new ExpoResponse();

      // pipe
      stream.pipe(res);
    });
  };
}
