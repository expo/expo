import { MetroDevServerOptions } from '@expo/dev-server';
import http from 'http';
import Metro from 'metro';
import path from 'path';
import { Terminal } from 'metro-core';
import resolveFrom from 'resolve-from';

import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importExpoMetroConfigFromProject, importMetroFromProject } from './resolveFromProject';
import { env } from '../../../utils/env';

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

  let metroConfig = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });

  metroConfig = withMetroWeb(projectRoot, metroConfig);

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

export function withMetroWeb(projectRoot: string, config: import('metro-config').ConfigT) {
  if (!env.EXPO_USE_METRO_WEB) {
    return config;
  }

  // Add basic source extension support with all platforms stripped away.
  const { getBareExtensions } = require('@expo/config/paths');

  const sourceExts = getBareExtensions([], {
    isTS: true,
    isReact: true,
    isModern: false,
  });

  // @ts-expect-error
  config.resolver.sourceExts = sourceExts;

  // Create a resolver which dynamically disables support for
  // `*.native.*` extensions on web.

  const { resolve } = require(resolveFrom(projectRoot, 'metro-resolver'));

  // @ts-expect-error
  config.resolver.resolveRequest = (context, _realModuleName, platform, moduleName) => {
    const contextResolveRequest = context.resolveRequest;
    delete context.resolveRequest;
    try {
      // Disable `*.native.*` extensions on web.
      context.preferNativePlatform = platform !== 'web';
      return resolve(context, moduleName, platform);
    } catch (e) {
      throw e;
    } finally {
      context.resolveRequest = contextResolveRequest;
    }
  };

  if (!config.resolver.extraNodeModules) {
    // @ts-expect-error
    config.resolver.extraNodeModules = {};
  }

  // Remap `react-native` to `react-native-web` -- no idea how this works across platforms.
  config.resolver.extraNodeModules['react-native'] = path.resolve(
    require.resolve('react-native-web/package.json'),
    '..'
  );

  if (!config.resolver.platforms.includes('web')) {
    // @ts-expect-error
    config.resolver.platforms = ['ios', 'android', 'web']; // .push('web');
  }

  return config;
}
