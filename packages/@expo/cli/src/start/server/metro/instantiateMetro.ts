import { getConfig } from '@expo/config';
import http from 'http';
import Metro from 'metro';
import { Terminal } from 'metro-core';

import { MetroDevServerOptions } from '../../../export/bundleAsync';
import { createDevServerMiddleware } from '../middleware/devServerMiddleware';
import { getPlatformBundlers } from '../platformBundlers';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importExpoMetroConfigFromProject, importMetroFromProject } from './resolveFromProject';
import { withMetroMultiPlatform } from './withMetroMultiPlatform';

export type MessageSocket = {
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

  let metroConfig = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });

  // TODO: When we bring expo/metro-config into the expo/expo repo, then we can upstream this.
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true, skipPlugins: true });
  const platformBundlers = getPlatformBundlers(exp);
  metroConfig = withMetroMultiPlatform(projectRoot, metroConfig, platformBundlers);

  const {
    middleware,
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
    hmrEnabled: true,
    websocketEndpoints,
  });

  reportEvent = eventsSocketEndpoint.reportEvent;

  return {
    server,
    middleware,
    messageSocket: messageSocketEndpoint,
  };
}
