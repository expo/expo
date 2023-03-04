import { getConfig } from '@expo/config';
import { MetroDevServerOptions } from '@expo/dev-server';
import chalk from 'chalk';
import http from 'http';
import type Metro from 'metro';
import { Terminal } from 'metro-core';

import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { getPlatformBundlers } from '../platformBundlers';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importExpoMetroConfigFromProject } from './resolveFromProject';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  projectRoot: string,
  options: Omit<MetroDevServerOptions, 'logger'>
): Promise<{
  metro: Metro.Server;
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  let reportEvent: ((event: any) => void) | undefined;

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

  const { middleware, websocketEndpoints, eventsSocketEndpoint, messageSocketEndpoint } =
    createDevServerMiddleware(projectRoot, {
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

  middleware.use(createDebuggerTelemetryMiddleware(projectRoot, exp));

  const { server, metro } = await runServer(projectRoot, metroConfig, {
    hmrEnabled: true,
    websocketEndpoints,
    watch: isWatchEnabled(),
  });

  // RN +68 -- Expo SDK +45
  reportEvent = eventsSocketEndpoint.reportEvent;

  return {
    metro,
    server,
    middleware,
    messageSocket: messageSocketEndpoint,
  };
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
