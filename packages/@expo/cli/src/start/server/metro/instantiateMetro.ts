import { MetroDevServerOptions } from '@expo/dev-server';
import http from 'http';
import Metro from 'metro';
import { Terminal } from 'metro-core';

import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importExpoMetroConfigFromProject, importMetroFromProject } from './resolveFromProject';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  projectRoot: string,
  options: Omit<MetroDevServerOptions, 'logger'>
): Promise<{
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  let reportEvent: ((event: any) => void) | undefined;

  const Metro = importMetroFromProject(projectRoot);
  const ExpoMetroConfig = importExpoMetroConfigFromProject(projectRoot);

  const terminal = new Terminal(process.stdout);
  const terminalReporter = new MetroTerminalReporter(projectRoot, terminal);

  const reporter = {
    update(event: any) {
      terminalReporter.update(event);
      if (reportEvent) {
        reportEvent(event);
      }
    },
  };

  const metroConfig = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });

  const {
    middleware,
    attachToServer,

    // New
    websocketEndpoints,
    eventsSocketEndpoint,
    messageSocketEndpoint,
  } = createDevServerMiddleware(projectRoot, {
    port: metroConfig.server.port,
    watchFolders: metroConfig.watchFolders,
  });

  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
  // @ts-ignore can't mutate readonly config
  metroConfig.server.enhanceMiddleware = (metroMiddleware: any, server: Metro.Server) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }
    return middleware.use(metroMiddleware);
  };

  const server = await Metro.runServer(metroConfig, {
    // @ts-expect-error: TODO: Update the types.
    hmrEnabled: true,
    websocketEndpoints,
  });

  if (attachToServer) {
    // Expo SDK 44 and lower
    const { messageSocket, eventsSocket } = attachToServer(server);
    reportEvent = eventsSocket.reportEvent;

    return {
      server,
      middleware,
      messageSocket,
    };
  } else {
    // RN +68 -- Expo SDK +45
    reportEvent = eventsSocketEndpoint.reportEvent;

    return {
      server,
      middleware,
      messageSocket: messageSocketEndpoint,
    };
  }
}
