// Copyright © 2023 650 Industries.
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forks https://github.com/facebook/metro/blob/b80d9a0f638ee9fb82ff69cd3c8d9f4309ca1da2/packages/metro/src/index.flow.js#L57
// and adds the ability to access the bundler instance.
import assert from 'assert';
import http from 'http';
import https from 'https';
import Metro, { RunServerOptions, Server } from 'metro';
import MetroHmrServer from 'metro/src/HmrServer';
import createWebsocketServer from 'metro/src/lib/createWebsocketServer';
import { ConfigT } from 'metro-config';
import { parse } from 'url';

import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { Log } from '../../../log';
import { getRunningProcess } from '../../../utils/getRunningProcess';
import type { ConnectAppType } from '../middleware/server.types';

export const runServer = async (
  metroBundler: MetroBundlerDevServer,
  config: ConfigT,
  {
    hasReducedPerformance = false,
    host,
    onError,
    onReady,
    secureServerOptions,
    waitForBundler = false,
    websocketEndpoints = {},
    watch,
  }: RunServerOptions
): Promise<{ server: http.Server | https.Server; metro: Server }> => {
  // await earlyPortCheck(host, config.server.port);

  // if (secure != null || secureCert != null || secureKey != null) {
  //   // eslint-disable-next-line no-console
  //   console.warn(
  //     chalk.inverse.yellow.bold(' DEPRECATED '),
  //     'The `secure`, `secureCert`, and `secureKey` options are now deprecated. ' +
  //       'Please use the `secureServerOptions` object instead to pass options to ' +
  //       "Metro's https development server.",
  //   );
  // }

  const { middleware, end, metroServer } = await Metro.createConnectMiddleware(config, {
    hasReducedPerformance,
    waitForBundler,
    watch,
  });

  assert(typeof (middleware as any).use === 'function');
  const serverApp = middleware as ConnectAppType;

  let httpServer: http.Server | https.Server;

  if (secureServerOptions != null) {
    httpServer = https.createServer(secureServerOptions, serverApp);
  } else {
    httpServer = http.createServer(serverApp);
  }
  return new Promise<{ server: http.Server | https.Server; metro: Server }>((resolve, reject) => {
    httpServer.on('error', (error) => {
      if ('code' in error && error.code === 'EADDRINUSE') {
        // If `Error: listen EADDRINUSE: address already in use :::8081` then print additional info
        // about the process before throwing.
        const info = getRunningProcess(config.server.port);
        if (info) {
          Log.error(
            `Port ${config.server.port} is busy running ${info.command} in: ${info.directory}`
          );
        }
      }

      if (onError) {
        onError(error);
      }
      reject(error);
      end();
    });

    httpServer.listen(config.server.port, host, () => {
      if (onReady) {
        onReady(httpServer);
      }

      Object.assign(websocketEndpoints, {
        // @ts-expect-error: incorrect types
        '/hot': createWebsocketServer({
          websocketServer: new MetroHmrServer(
            metroServer.getBundler(),
            metroServer.getCreateModuleId(),
            config
          ),
        }),
      });

      httpServer.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url!);
        if (pathname != null && websocketEndpoints[pathname]) {
          websocketEndpoints[pathname].handleUpgrade(request, socket, head, (ws) => {
            websocketEndpoints[pathname].emit('connection', ws, request);
          });
        } else {
          socket.destroy();
        }
      });

      resolve({ server: httpServer, metro: metroServer });
    });

    // Disable any kind of automatic timeout behavior for incoming
    // requests in case it takes the packager more than the default
    // timeout of 120 seconds to respond to a request.
    httpServer.timeout = 0;

    httpServer.on('close', () => {
      end();
    });
  });
};
