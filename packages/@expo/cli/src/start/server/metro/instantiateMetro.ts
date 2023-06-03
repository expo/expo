import { ExpoConfig, getConfig } from '@expo/config';
import { MetroDevServerOptions } from '@expo/dev-server';
import type { LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import http from 'http';
import type Metro from 'metro';
import { Terminal } from 'metro-core';

import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { getMetroServerRoot } from '../middleware/ManifestMiddleware';
import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { getPlatformBundlers } from '../platformBundlers';
import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importExpoMetroConfig } from './resolveFromProject';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';
import { getRouterDirectory } from './router';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

export async function loadMetroConfigAsync(
  projectRoot: string,
  options: LoadOptions,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true, skipPlugins: true }).exp,
  }: { exp?: ExpoConfig } = {}
) {
  let reportEvent: ((event: any) => void) | undefined;
  const serverRoot = getMetroServerRoot(projectRoot);

  const terminal = new Terminal(process.stdout);
  const terminalReporter = new MetroTerminalReporter(serverRoot, terminal);

  const reporter = {
    update(event: any) {
      terminalReporter.update(event);
      if (reportEvent) {
        reportEvent(event);
      }
    },
  };

  const ExpoMetroConfig = importExpoMetroConfig(projectRoot);
  let config = await ExpoMetroConfig.loadAsync(projectRoot, { reporter, ...options });

  const platformBundlers = getPlatformBundlers(exp);

  config = await withMetroMultiPlatformAsync(projectRoot, {
    routerDirectory: exp.extra?.router?.unstable_src ?? getRouterDirectory(projectRoot),
    config,
    platformBundlers,
    isTsconfigPathsEnabled: !!exp.experiments?.tsconfigPaths,
    webOutput: exp.web?.output ?? 'single',
  });

  logEventAsync('metro config', getMetroProperties(projectRoot, exp, config));

  return {
    config,
    setEventReporter: (logger: (event: any) => void) => (reportEvent = logger),
    reporter: terminalReporter,
  };
}

/** The most generic possible setup for Metro bundler. */
export async function instantiateMetroAsync(
  metroBundler: MetroBundlerDevServer,
  options: Omit<MetroDevServerOptions, 'logger'>
): Promise<{
  metro: Metro.Server;
  server: http.Server;
  middleware: any;
  messageSocket: MessageSocket;
}> {
  const projectRoot = metroBundler.projectRoot;

  // TODO: When we bring expo/metro-config into the expo/expo repo, then we can upstream this.
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
    skipPlugins: true,
  });

  const { config: metroConfig, setEventReporter } = await loadMetroConfigAsync(
    projectRoot,
    options,
    { exp }
  );

  const { middleware, websocketEndpoints, eventsSocketEndpoint, messageSocketEndpoint } =
    createDevServerMiddleware(projectRoot, {
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });

  const customEnhanceMiddleware = metroConfig.server.enhanceMiddleware;
  // @ts-expect-error: can't mutate readonly config
  metroConfig.server.enhanceMiddleware = (metroMiddleware: any, server: Metro.Server) => {
    if (customEnhanceMiddleware) {
      metroMiddleware = customEnhanceMiddleware(metroMiddleware, server);
    }
    return middleware.use(metroMiddleware);
  };

  middleware.use(createDebuggerTelemetryMiddleware(projectRoot, exp));

  const { server, metro } = await runServer(metroBundler, metroConfig, {
    hmrEnabled: true,
    websocketEndpoints,
    watch: isWatchEnabled(),
  });

  setEventReporter(eventsSocketEndpoint.reportEvent);

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
