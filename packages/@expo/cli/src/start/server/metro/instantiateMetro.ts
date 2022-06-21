import { getConfig } from '@expo/config';
import { MetroDevServerOptions } from '@expo/dev-server';
import fs from 'fs';
import http from 'http';
import Metro from 'metro';
import { Terminal } from 'metro-core';
import type { ResolutionContext } from 'metro-resolver';
import path from 'path';
import resolveFrom from 'resolve-from';

import { createDevServerMiddleware } from '../middleware/createDevServerMiddleware';
import { getPlatformBundlers, PlatformBundlers } from '../platformBundlers';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import {
  importExpoMetroConfigFromProject,
  importMetroFromProject,
  importMetroResolverFromProject,
} from './resolveFromProject';

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

  // TODO: When we bring expo/metro-config into the expo/expo repo, then we can upstream this.
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true, skipPlugins: true });
  const platformBundlers = getPlatformBundlers(exp);
  metroConfig = withMetroMultiPlatform(projectRoot, metroConfig, platformBundlers);

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

/** Add support for `react-native-web` and the Web platform. */
export function withMetroMultiPlatform(
  projectRoot: string,
  config: import('metro-config').ConfigT,
  platformBundlers: PlatformBundlers
) {
  let expoConfigPlatforms = Object.entries(platformBundlers)
    .filter(([, bundler]) => bundler === 'metro')
    .map(([platform]) => platform);

  if (Array.isArray(config.resolver.platforms)) {
    expoConfigPlatforms = [...new Set(expoConfigPlatforms.concat(config.resolver.platforms))];
  }

  // @ts-expect-error: typed as `readonly`.
  config.resolver.platforms = expoConfigPlatforms;

  // Bail out early for performance enhancements if web is not enabled.
  if (platformBundlers.web !== 'metro') {
    return config;
  }

  const reactNativePath = path.dirname(resolveFrom(projectRoot, 'react-native/package.json'));

  // @ts-expect-error: readonly
  config.serializer.getPolyfills = ({ platform }) => {
    if (platform === 'web') {
      return [
        // TODO: runtime polyfills, i.e. Fast Refresh, error overlay, React Dev Tools...
      ];
    }
    return require(path.join(reactNativePath, 'rn-get-polyfills'))();
  };

  // Get the `transformer.assetRegistryPath`
  // this needs to be unified since you can't dynamically
  // swap out the transformer based on platform.
  const assetRegistryPath = fs.realpathSync(
    path.resolve(resolveFrom(projectRoot, '@react-native/assets/registry.js'))
  );

  // Create a resolver which dynamically disables support for
  // `*.native.*` extensions on web.

  const { resolve } = importMetroResolverFromProject(projectRoot);

  const extraNodeModules: { [key: string]: Record<string, string> } = {
    web: {
      'react-native': path.resolve(require.resolve('react-native-web/package.json'), '..'),
    },
  };

  Object.defineProperty(config.resolver, 'resolveRequest', {
    value: (immutableContext: ResolutionContext, moduleName: string, platform: string | null) => {
      // Must copy the immutable context so we can modify it.
      const context: ResolutionContext = {
        ...immutableContext,
        resolveRequest: undefined,
        // Ensure this is set correctly
        preferNativePlatform: platform !== 'web',
      };

      // Conditionally remap `react-native` to `react-native-web`
      if (platform && platform in extraNodeModules) {
        context.extraNodeModules = extraNodeModules[platform];
      }

      const result = resolve(context, moduleName, platform);

      // Replace the web resolver with the original one.
      // This is basically an alias for web-only.
      if (
        platform === 'web' &&
        result?.type === 'sourceFile' &&
        typeof result?.filePath === 'string' &&
        result.filePath.endsWith('react-native-web/dist/modules/AssetRegistry/index.js')
      ) {
        // @ts-expect-error: `readonly` for some reason.
        result.filePath = assetRegistryPath;
      }

      return result;
    },
  });

  return config;
}
