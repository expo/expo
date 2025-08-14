import { createRequestHandler } from '@expo/server/adapter/http';
import chalk from 'chalk';
import connect from 'connect';
import http from 'http';
import path from 'path';
import send from 'send';

import * as Log from '../log';
import { directoryExistsAsync, fileExistsAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import { findUpProjectRootOrAssert } from '../utils/findUp';
import { setNodeEnv } from '../utils/nodeEnv';
import { resolvePortAsync } from '../utils/port';

type Options = {
  port?: number;
  isDefaultDirectory: boolean;
};

const debug = require('debug')('expo:serve') as typeof console.log;

// Start a basic http server
export async function serveAsync(inputDir: string, options: Options) {
  const projectRoot = findUpProjectRootOrAssert(inputDir);

  setNodeEnv('production');
  require('@expo/env').load(projectRoot);

  const port = await resolvePortAsync(projectRoot, {
    defaultPort: options.port,
    fallbackPort: 8081,
  });

  if (port == null) {
    throw new CommandError('Could not start server. Port is not available.');
  }
  options.port = port;

  const serverDist = options.isDefaultDirectory ? path.join(inputDir, 'dist') : inputDir;
  //  TODO: `.expo/server/ios`, `.expo/server/android`, etc.

  if (!(await directoryExistsAsync(serverDist))) {
    throw new CommandError(
      `The server directory ${serverDist} does not exist. Run \`npx expo export\` first.`
    );
  }

  const isStatic = await isStaticExportAsync(serverDist);

  Log.log(chalk.dim(`Starting ${isStatic ? 'static ' : ''}server in ${serverDist}`));

  if (isStatic) {
    await startStaticServerAsync(serverDist, options);
  } else {
    await startDynamicServerAsync(serverDist, options);
  }
  Log.log(`Server running at http://localhost:${options.port}`);
  // Detect the type of server we need to setup:
}

async function startStaticServerAsync(dist: string, options: Options) {
  const server = http.createServer((req, res) => {
    // Remove query strings and decode URI
    const filePath = decodeURI(req.url?.split('?')[0] ?? '');

    send(req, filePath, {
      root: dist,
      index: 'index.html',
      extensions: ['html'],
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

  server.listen(options.port!);
}

async function startDynamicServerAsync(dist: string, options: Options) {
  const middleware = connect();

  const staticDirectory = path.join(dist, 'client');
  const serverDirectory = path.join(dist, 'server');

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
    if (!req?.url || (req.method !== 'GET' && req.method !== 'HEAD')) {
      return next();
    }

    const pathname = canParseURL(req.url) ? new URL(req.url).pathname : req.url;
    if (!pathname) {
      return next();
    }

    debug(`Maybe serve static:`, pathname);

    const stream = send(req, pathname, {
      root: staticDirectory,
      extensions: ['html'],
    });

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
  });

  middleware.use(serverHandler);

  middleware.listen(options.port!);
}

function canParseURL(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function isStaticExportAsync(dist: string): Promise<boolean> {
  const routesFile = path.join(dist, `server/_expo/routes.json`);
  return !(await fileExistsAsync(routesFile));
}
