import { getConfig } from '@expo/config';
import { MetroDevServerOptions } from '@expo/dev-server';
import chalk from 'chalk';
import http from 'http';
import Metro from 'metro';
import { Terminal } from 'metro-core';

import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { getPlatformBundlers } from '../platformBundlers';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { createInspectorProxy } from './inspector-proxy';
import { importExpoMetroConfigFromProject, importMetroFromProject } from './resolveFromProject';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  metroBundler: MetroBundlerDevServer,
  options: Omit<MetroDevServerOptions, 'logger'>
): Promise<{
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  const projectRoot = metroBundler.projectRoot;

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
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });

  const platformBundlers = getPlatformBundlers(exp);
  metroConfig = await withMetroMultiPlatformAsync(projectRoot, metroConfig, platformBundlers);

  logEventAsync('metro config', getMetroProperties(projectRoot, exp, metroConfig));

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

  // Create the custom inspector proxy only when enabled and opt-in
  const inspectorProxy =
    metroConfig.server.runInspectorProxy && env.EXPO_USE_CUSTOM_INSPECTOR_PROXY
      ? createInspectorProxy(metroBundler, metroBundler.projectRoot)
      : null;

  if (inspectorProxy) {
    // @ts-expect-error Property is read-only, but we need to disable it
    metroConfig.server.runInspectorProxy = false;
  }

  middleware.use(createDebuggerTelemetryMiddleware(projectRoot, exp));

  const server = await Metro.runServer(metroConfig, {
    hmrEnabled: true,
    websocketEndpoints: {
      ...websocketEndpoints,
      ...(inspectorProxy ? inspectorProxy.createWebSocketListeners() : {}),
    },
    // @ts-expect-error Property was added in 0.73.4, remove this statement when updating Metro
    watch: isWatchEnabled(),
  });

  // Hook the inspector proxy in the Metro server
  if (inspectorProxy) {
    inspectorProxy.setServerAddress(server);
    middleware.use(inspectorProxy.processRequest);
  }

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

/**
 * Simplify and communicate if Metro is running without watching file updates,.
 * Exposed for testing.
 */
export function isWatchEnabled() {
  if (env.CI) {
    Log.log(
      chalk`Metro is running in CI mode, reloads are disabled. Remove {bold CI=true} to enable watch mode.`
    );
  }

  return !env.CI;
}
