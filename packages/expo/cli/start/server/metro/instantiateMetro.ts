import { MetroDevServerOptions } from '@expo/dev-server';
import http from 'http';
import Metro from 'metro';
// import { Terminal } from 'metro-core';
// import { MetroTerminalReporter } from './MetroTerminalReporter';

import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { importExpoMetroConfigFromProject, importMetroFromProject } from './resolveFromProject';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

export async function getMetroConfigAsync(
  projectRoot: string,
  options: Omit<MetroDevServerOptions, 'logger'>
) {
  const ExpoMetroConfig = importExpoMetroConfigFromProject(projectRoot);

  let reportEvent: ((event: any) => void) | undefined;

  const config = await ExpoMetroConfig.loadAsync(projectRoot, {
    reporter: {
      update(event: any) {
        reportEvent?.(event);
      },
    },
    ...options,
  });

  return {
    config,
    setEventReporter(report: (event: any) => void) {
      reportEvent = report;
    },
  };
}

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  projectRoot: string,
  options: Omit<MetroDevServerOptions, 'logger'>
): Promise<{
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  const Metro = importMetroFromProject(projectRoot);

  const { config, setEventReporter } = await getMetroConfigAsync(projectRoot, options);

  const { middleware, attachToServer } = createDevServerMiddleware({
    port: config.server.port,
    watchFolders: config.watchFolders,
  });

  const customEnhanceMiddleware = config.server.enhanceMiddleware;
  // @ts-ignore can't mutate readonly config
  metroConfig.server.enhanceMiddleware = (metroMiddleware: any, server: Metro.Server) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }
    return middleware.use(metroMiddleware);
  };

  const server = await Metro.runServer(config, {
    // @ts-expect-error: TODO: Update the types.
    hmrEnabled: true,
  });

  const { messageSocket, eventsSocket } = attachToServer(server);
  setEventReporter(eventsSocket.reportEvent);

  return {
    server,
    middleware,
    messageSocket,
  };
}
