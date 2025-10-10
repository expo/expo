/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';
import { installAsync } from '../../../install/installAsync';

const debug = require('debug')('expo:start:server:middleware:install') as typeof console.log;

export type InstallDevPackageBody = {
  pkg: string;
};

/**
 * Middleware for installing packages in the project given a `POST` request with
 * `{ pkg: string }` in the body.
 */
export class InstallDevPackageMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/_expo/install-pkg']);
  }

  protected async parseRawBody(req: ServerRequest): Promise<InstallDevPackageBody> {
    const rawBody = await new Promise<string>((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', (err) => {
        reject(err);
      });
    });

    const properties = JSON.parse(rawBody);
    this.assertPkgBody(properties);

    return properties;
  }

  private assertPkgBody(body: any): asserts body is InstallDevPackageBody {
    if (typeof body !== 'object' || body == null) {
      throw new Error('Expected object');
    }
    if (typeof body.pkg !== 'string') {
      throw new Error('Expected "pkg" in body to be string');
    }
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let properties: InstallDevPackageBody;

    try {
      properties = await this.parseRawBody(req);
    } catch (e) {
      debug('Error parsing request body', e);
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }
    debug(`Requested: %O`, properties);

    try {
      await installAsync([properties.pkg], {
        projectRoot: this.projectRoot,
      });
    } catch (e) {
      debug('Error writing file', e);
      res.statusCode = 500;
      res.end('Error writing file.');
      return;
    }

    debug(`File created`);
    res.statusCode = 200;
    res.end('OK');
  }
}
