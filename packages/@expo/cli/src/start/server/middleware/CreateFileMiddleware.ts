import fs from 'fs';
import path from 'path';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:createFile') as typeof console.log;

export type TouchFileBody = { path: string; contents: string };

/**
 * Middleware for creating a file given a `POST` request with
 * `{ contents: string, path: string }` in the body.
 */
export class CreateFileMiddleware extends ExpoMiddleware {
  constructor(protected projectRoot: string) {
    super(projectRoot, ['/_expo/touch']);
  }

  protected resolvePath(inputPath: string): string {
    let resolvedPath = path.join(this.projectRoot, inputPath);
    const extension = path.extname(resolvedPath);
    if (extension === '.js') {
      // Automatically convert JS files to TS files when added to a project
      // with TypeScript.
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        resolvedPath = resolvedPath.replace(/\.js$/, '.tsx');
      }
    }

    return resolvedPath;
  }

  protected async parseRawBody(req: ServerRequest): Promise<TouchFileBody> {
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
    this.assertTouchFileBody(properties);

    return properties;
  }

  private assertTouchFileBody(body: any): asserts body is TouchFileBody {
    if (typeof body !== 'object' || body == null) {
      throw new Error('Expected object');
    }
    if (typeof body.path !== 'string') {
      throw new Error('Expected "path" in body to be string');
    }
    if (typeof body.contents !== 'string') {
      throw new Error('Expected "contents" in body to be string');
    }
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let properties: TouchFileBody;

    try {
      properties = await this.parseRawBody(req);
    } catch (e) {
      debug('Error parsing request body', e);
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    debug(`Requested: %O`, properties);

    const resolvedPath = this.resolvePath(properties.path);

    if (fs.existsSync(resolvedPath)) {
      res.statusCode = 409;
      res.end('File already exists.');
      return;
    }

    debug(`Resolved path:`, resolvedPath);

    try {
      await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.promises.writeFile(resolvedPath, properties.contents, 'utf8');
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
