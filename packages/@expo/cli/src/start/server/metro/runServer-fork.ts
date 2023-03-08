// Copyright © 2023 650 Industries.
// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forks https://github.com/facebook/metro/blob/b80d9a0f638ee9fb82ff69cd3c8d9f4309ca1da2/packages/metro/src/index.flow.js#L57
// and adds the ability to access the bundler instance.
import http from 'http';
import https from 'https';
import { RunServerOptions, Server } from 'metro';
import { ConfigT } from 'metro-config';
import { InspectorProxy } from 'metro-inspector-proxy';
import { parse } from 'url';

import { env } from '../../../utils/env';
import { createInspectorProxy, ExpoInspectorProxy } from './inspector-proxy';
import {
  importMetroCreateWebsocketServerFromProject,
  importMetroFromProject,
  importMetroHmrServerFromProject,
  importMetroInspectorProxyFromProject,
} from './resolveFromProject';

export const runServer = async (
  projectRoot: string,
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
  const Metro = importMetroFromProject(projectRoot);

  const createWebsocketServer = importMetroCreateWebsocketServerFromProject(projectRoot);

  const { InspectorProxy } = importMetroInspectorProxyFromProject(projectRoot);

  const MetroHmrServer = importMetroHmrServerFromProject(projectRoot);

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
  // Lazy require
  const connect = require('connect');

  const serverApp = connect();

  const { middleware, end, metroServer } = await Metro.createConnectMiddleware(config, {
    // @ts-expect-error
    hasReducedPerformance,
    waitForBundler,
    watch,
  });

  serverApp.use(middleware);

  let inspectorProxy: InspectorProxy | ExpoInspectorProxy | null = null;
  if (config.server.runInspectorProxy && env.EXPO_USE_CUSTOM_INSPECTOR_PROXY) {
    inspectorProxy = createInspectorProxy(config.projectRoot);
  } else if (config.server.runInspectorProxy) {
    inspectorProxy = new InspectorProxy(config.projectRoot);
  }

  let httpServer: http.Server | https.Server;

  if (secureServerOptions != null) {
    httpServer = https.createServer(secureServerOptions, serverApp);
  } else {
    httpServer = http.createServer(serverApp);
  }
  return new Promise<{ server: http.Server | https.Server; metro: Server }>((resolve, reject) => {
    httpServer.on('error', (error) => {
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
        ...(inspectorProxy ? { ...inspectorProxy.createWebSocketListeners(httpServer) } : {}),
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

      if (inspectorProxy) {
        // TODO(hypuk): Refactor inspectorProxy.processRequest into separate request handlers
        // so that we could provide routes (/json/list and /json/version) here.
        // Currently this causes Metro to give warning about T31407894.
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        serverApp.use(inspectorProxy.processRequest.bind(inspectorProxy));
      }

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
