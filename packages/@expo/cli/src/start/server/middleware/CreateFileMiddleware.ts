import fs from 'fs';
import path from 'path';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:createFile') as typeof console.log;

export class CreateFileMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/_expo/touch']);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }
    if (!req.rawBody) {
      res.statusCode = 400;
      res.end(
        'Missing results of body-parser (`rawBody` property). This is a bug in the Expo CLI.'
      );
      return;
    }
    const properties = JSON.parse(req.rawBody) as { contents: string; path: string };

    debug(`Requested: %O`, properties);
    if (properties.contents == null || properties.path == null) {
      res.statusCode = 400;
      res.end('Missing contents or path in POST request body to /_expo/touch.');
      return;
    }

    let resolvedPath = path.join(this.projectRoot, properties.path);

    if (!path.extname(resolvedPath).length) {
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        resolvedPath += '.tsx';
      } else {
        resolvedPath += '.js';
      }
    }

    if (fs.existsSync(resolvedPath)) {
      res.statusCode = 409;
      res.end('File already exists.');
      return;
    }

    debug(`Resolved path:`, resolvedPath);

    await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.promises.writeFile(resolvedPath, properties.contents, 'utf8');

    debug(`File created`);
    res.statusCode = 200;
    res.end('OK');
  }
}
