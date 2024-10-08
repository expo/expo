// Copyright © 2023 650 Industries.
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forks https://github.com/facebook/metro/blob/b80d9a0f638ee9fb82ff69cd3c8d9f4309ca1da2/packages/metro/src/index.flow.js#L57
// and adds the ability to access the bundler instance.
import { createConnectMiddleware, type RunServerOptions } from '@bycedric/metro/metro';
import MetroHmrServer from '@bycedric/metro/metro/src/HmrServer';
import type Server from '@bycedric/metro/metro/src/Server';
import createWebsocketServer from '@bycedric/metro/metro/src/lib/createWebsocketServer';
import { ConfigT } from '@bycedric/metro/metro-config';
import assert from 'assert';
import http from 'http';
import https from 'https';
import { parse } from 'url';
import type { WebSocketServer } from 'ws';

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
  }: Omit<RunServerOptions, 'websocketEndpoints'> & {
    // NOTE(cedric): Metro uses on older version of `ws`, with incorrect types
    websocketEndpoints: Record<string, WebSocketServer>;
  },
  {
    mockServer,
  }: {
    // Use a mock server object instead of creating a real server, this is used in export cases where we want to reuse codepaths but not actually start a server.
    mockServer: boolean;
  }
): Promise<{
  server: http.Server | https.Server;
  hmrServer: MetroHmrServer | null;
  metro: Server;
}> => {
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

  const { middleware, end, metroServer } = await createConnectMiddleware(config, {
    hasReducedPerformance,
    waitForBundler,
    watch,
  });

  if (!mockServer) {
    assert(typeof (middleware as any).use === 'function');
  }
  const serverApp = middleware as ConnectAppType;

  let httpServer: http.Server | https.Server;

  if (secureServerOptions != null) {
    httpServer = https.createServer(secureServerOptions, serverApp);
  } else {
    httpServer = http.createServer(serverApp);
  }

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
    end();
  });

  // Disable any kind of automatic timeout behavior for incoming
  // requests in case it takes the packager more than the default
  // timeout of 120 seconds to respond to a request.
  httpServer.timeout = 0;

  httpServer.on('close', () => {
    end();
  });

  // Extend the close method to ensure all websocket servers are closed, and connections are terminated
  const originalClose = httpServer.close.bind(httpServer);

  httpServer.close = function closeHttpServer(callback) {
    originalClose(callback);

    // Close all websocket servers, including possible client connections (see: https://github.com/websockets/ws/issues/2137#issuecomment-1507469375)
    for (const endpoint of Object.values(websocketEndpoints) as WebSocketServer[]) {
      endpoint.close();
      endpoint.clients.forEach((client) => client.terminate());
    }

    // Forcibly close active connections
    this.closeAllConnections();
    return this;
  };

  if (mockServer) {
    return { server: httpServer, hmrServer: null, metro: metroServer };
  }

  return new Promise<{
    server: http.Server | https.Server;
    hmrServer: MetroHmrServer;
    metro: Server;
  }>((resolve, reject) => {
    httpServer.on('error', (error) => {
      reject(error);
    });

    httpServer.listen(config.server.port, host, () => {
      if (onReady) {
        onReady(httpServer);
      }

      const hmrServer = new MetroHmrServer(
        metroServer.getBundler(),
        metroServer.getCreateModuleId(),
        config
      );

      Object.assign(websocketEndpoints, {
        '/hot': createWebsocketServer({
          websocketServer: hmrServer,
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

      resolve({ server: httpServer, hmrServer, metro: metroServer });
    });
  });
};
