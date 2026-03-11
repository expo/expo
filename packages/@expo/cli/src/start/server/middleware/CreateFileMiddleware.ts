/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:createFile') as typeof console.log;

interface TouchFileInput {
  type: 'router_index';
}

interface TouchFileOutput {
  absolutePath: string;
  contents: string;
}

const ROUTER_INDEX_CONTENTS = `import { StyleSheet, Text, View } from "react-native";

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>Hello World</Text>
        <Text style={styles.subtitle}>This is the first page of your app.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
`;

interface CreateFileMiddlewareOptions {
  /** The absolute metro or server root, used to calculate the relative dom entry path */
  metroRoot: string;
  /** The absolute project root, used to resolve the `expo/dom/entry.js` path */
  projectRoot: string;
  /** The expo-router root */
  appDir: string;
}

/**
 * Middleware for creating a file given a `POST` request with
 * `{ contents: string, path: string }` in the body.
 */
export class CreateFileMiddleware extends ExpoMiddleware {
  constructor(protected options: CreateFileMiddlewareOptions) {
    super(options.projectRoot, ['/_expo/touch']);
  }

  protected resolveExtension(basePath: string, relativePath: string): string {
    let resolvedPath = relativePath;
    const extension = path.extname(relativePath);
    if (extension === '.js') {
      // Automatically convert JS files to TS files when added to a project
      // with TypeScript.
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        resolvedPath = resolvedPath.replace(/\.js$/, '.tsx');
      }
    }
    return path.join(basePath, resolvedPath);
  }

  protected async parseRawBody(req: ServerRequest): Promise<TouchFileInput> {
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

    const body = JSON.parse(rawBody);
    if (typeof body !== 'object' || body == null) {
      throw new Error('Expected object');
    } else if (typeof body.type !== 'string') {
      throw new Error('Expected "type" in body to be string');
    }

    switch (body.type) {
      case 'router_index':
        return body;
      default:
        throw new Error('Unknown "type" passed in body');
    }
  }

  private makeOutputForInput(input: TouchFileInput): TouchFileOutput {
    switch (input.type) {
      case 'router_index':
        return {
          absolutePath: this.resolveExtension(this.options.appDir, 'index.js'),
          contents: ROUTER_INDEX_CONTENTS,
        };
    }
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    let properties: TouchFileInput;
    try {
      properties = await this.parseRawBody(req);
    } catch (e) {
      debug('Error parsing request body', e);
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    debug(`Requested: %O`, properties);

    const file = this.makeOutputForInput(properties);
    if (fs.existsSync(file.absolutePath)) {
      res.statusCode = 409;
      res.end('File already exists.');
      return;
    }

    debug(`Resolved path:`, file.absolutePath);

    try {
      await fs.promises.mkdir(path.dirname(file.absolutePath), { recursive: true });
      await fs.promises.writeFile(file.absolutePath, file.contents, 'utf8');
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
