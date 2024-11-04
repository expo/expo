import connect from 'connect';
import * as Log from '../log';
import path from 'path';
import { setNodeEnv } from '../utils/nodeEnv';
import { directoryExistsAsync, fileExistsAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import chalk from 'chalk';
import send from 'send';
type Options = {
  port?: number;
  isDefaultDirectory: boolean;
};

// Start a basic http server
import http from 'http';
import { createRequestHandler } from '@expo/server/build/vendor/http';

export async function serveAsync(projectRoot: string, options: Options) {
  setNodeEnv('production');
  require('@expo/env').load(projectRoot);

  const serverDist = options.isDefaultDirectory ? path.join(projectRoot, 'dist') : projectRoot;
  //  TODO: `.expo/server/ios`, `.expo/server/android`, etc.

  if (!(await directoryExistsAsync(serverDist))) {
    throw new CommandError(
      `The server directory ${serverDist} does not exist. Run \`npx expo export\` first.`
    );
  }

  const isStatic = await isStaticExportAsync(serverDist);

  Log.log(chalk.dim(`Starting ${isStatic ? 'static ' : ''}server in ${serverDist}`));

  if (isStatic) {
    const server = http.createServer((req, res) => {
      // Remove query strings and decode URI
      const filePath = decodeURI(req.url?.split('?')[0] ?? '');

      send(req, filePath, {
        root: serverDist,
        index: 'index.html',
      })
        .on('error', (err: any) => {
          if (err.status === 404) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
          }
          res.statusCode = err.status || 500;
          res.end('Internal Server Error');
        })
        .pipe(res);
    });

    const port = options.port ?? 3000;
    server.listen(port);
    Log.log(`Server running at http://localhost:${port}`);
  } else {
    const middleware = connect();

    const staticDirectory = path.join(serverDist, 'client');
    const serverDirectory = path.join(serverDist, 'server');

    const serverHandler = createRequestHandler({ build: serverDirectory });

    // DOM component CORS support
    middleware.use((req, res, next) => {
      // TODO: Only when origin is `file://` (iOS), and Android equivalent.

      // Required for DOM components security in release builds.

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, expo-platform'
      );

      // Handle OPTIONS preflight requests
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }
      next();
    });

    middleware.use((req, res, next) => {
      // Serve static files from the client directory first
      if (req.url) {
        send(req, decodeURI(req.url), {
          root: staticDirectory,
          index: false,
        })
          .on('error', (err: any) => {
            if (err.status === 404) {
              next();
              return;
            }
            res.statusCode = err.status || 500;
            res.end('Internal Server Error');
          })
          .pipe(res);
        return;
      }
      next();
    });
    middleware.use(serverHandler);

    const port = options.port ?? 3000;
    middleware.listen(port);
    Log.log(`Server running at http://localhost:${port}`);
  }

  // Detect the type of server we need to setup:
}

async function isStaticExportAsync(dist: string): Promise<boolean> {
  const routesFile = path.join(dist, `server/_expo/routes.json`);
  return !(await fileExistsAsync(routesFile));
}
