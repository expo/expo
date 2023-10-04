import { ExpoConfig, getConfig } from '@expo/config';
import type { LoadOptions } from '@expo/metro-config';
import chalk from 'chalk';
import { Server as ConnectServer } from 'connect';
import http from 'http';
import type Metro from 'metro';
import { Terminal } from 'metro-core';
import semver from 'semver';
import { URL } from 'url';

import { MetroBundlerDevServer } from './MetroBundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { importCliServerApiFromProject, importExpoMetroConfig } from './resolveFromProject';
import { getRouterDirectoryModuleIdWithManifest } from './router';
import { runServer } from './runServer-fork';
import { withMetroMultiPlatformAsync } from './withMetroMultiPlatform';
import { MetroDevServerOptions } from '../../../export/fork-bundleAsync';
import { Log } from '../../../log';
import { getMetroProperties } from '../../../utils/analytics/getMetroProperties';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { logEventAsync } from '../../../utils/analytics/rudderstackClient';
import { env } from '../../../utils/env';
import { getMetroServerRoot } from '../middleware/ManifestMiddleware';
import createJsInspectorMiddleware from '../middleware/inspector/createJsInspectorMiddleware';
import { prependMiddleware, replaceMiddlewareWith } from '../middleware/mutations';
import { remoteDevtoolsCorsMiddleware } from '../middleware/remoteDevtoolsCorsMiddleware';
import { remoteDevtoolsSecurityHeadersMiddleware } from '../middleware/remoteDevtoolsSecurityHeadersMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from '../middleware/server.types';
import { suppressRemoteDebuggingErrorMiddleware } from '../middleware/suppressErrorMiddleware';
import { getPlatformBundlers } from '../platformBundlers';

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};

function gteSdkVersion(exp: Pick<ExpoConfig, 'sdkVersion'>, sdkVersion: string): boolean {
  if (!exp.sdkVersion) {
    return false;
  }

  if (exp.sdkVersion === 'UNVERSIONED') {
    return true;
  }

  try {
    return semver.gte(exp.sdkVersion, sdkVersion);
  } catch {
    throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
  }
}

export async function loadMetroConfigAsync(
  projectRoot: string,
  options: LoadOptions,
  {
    exp = getConfig(projectRoot, { skipSDKVersionRequirement: true }).exp,
    isExporting,
  }: { exp?: ExpoConfig; isExporting: boolean }
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

  if (
    // Requires SDK 50 for expo-assets hashAssetPlugin change.
    !exp.sdkVersion ||
    gteSdkVersion(exp, '50.0.0')
  ) {
    if (isExporting) {
      // This token will be used in the asset plugin to ensure the path is correct for writing locally.
      // @ts-expect-error: typed as readonly.
      config.transformer.publicPath = `/assets?export_path=${
        (exp.experiments?.basePath ?? '') + '/assets'
      }`;
    } else {
      // @ts-expect-error: typed as readonly
      config.transformer.publicPath = '/assets/?unstable_path=.';
    }
  } else {
    if (isExporting && exp.experiments?.basePath) {
      // This token will be used in the asset plugin to ensure the path is correct for writing locally.
      // @ts-expect-error: typed as readonly.
      config.transformer.publicPath = exp.experiments?.basePath;
    }
  }

  const platformBundlers = getPlatformBundlers(exp);

  config = await withMetroMultiPlatformAsync(projectRoot, {
    routerDirectory: getRouterDirectoryModuleIdWithManifest(projectRoot, exp),
    config,
    platformBundlers,
    isTsconfigPathsEnabled: exp.experiments?.tsconfigPaths ?? true,
    webOutput: exp.web?.output ?? 'single',
    isFastResolverEnabled: env.EXPO_USE_FAST_RESOLVER,
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
  options: Omit<MetroDevServerOptions, 'logger'>,
  { isExporting }: { isExporting: boolean }
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
  });

  const { config: metroConfig, setEventReporter } = await loadMetroConfigAsync(
    projectRoot,
    options,
    { exp, isExporting }
  );

  const { createDevServerMiddleware, securityHeadersMiddleware } =
    importCliServerApiFromProject(projectRoot);

  const { middleware, messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints } =
    createDevServerMiddleware({
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });

  // securityHeadersMiddleware does not support cross-origin requests for remote devtools to get the sourcemap.
  // We replace with the enhanced version.
  replaceMiddlewareWith(
    middleware as ConnectServer,
    securityHeadersMiddleware,
    remoteDevtoolsSecurityHeadersMiddleware
  );

  middleware.use(remoteDevtoolsCorsMiddleware);

  prependMiddleware(middleware, suppressRemoteDebuggingErrorMiddleware);

  middleware.use('/inspector', createJsInspectorMiddleware());

  // TODO: We can probably drop this now.
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
    // @ts-expect-error: Inconsistent `websocketEndpoints` type between metro and @react-native-community/cli-server-api
    websocketEndpoints,
    watch: isWatchEnabled(),
  });

  prependMiddleware(middleware, (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
    // If the URL is a Metro asset request, then we need to skip all other middleware to prevent
    // the community CLI's serve-static from hosting `/assets/index.html` in place of all assets if it exists.
    // /assets/?unstable_path=.
    if (req.url) {
      const url = new URL(req.url!, 'http://localhost:8000');
      if (url.pathname.match(/^\/assets\/?/) && url.searchParams.get('unstable_path') != null) {
        return metro.processRequest(req, res, next);
      }
    }
    return next();
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
