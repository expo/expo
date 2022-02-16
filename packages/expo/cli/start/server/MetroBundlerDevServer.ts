import { MetroDevServerOptions, prependMiddleware } from '@expo/dev-server';
import http from 'http';
import Metro from 'metro';
import { Terminal } from 'metro-core';
import resolveFrom from 'resolve-from';

import { getFreePortAsync } from '../../utils/port';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from './BundlerDevServer';
import { MetroTerminalReporter } from './MetroTerminalReporter';
import { createDevServerMiddleware } from './middleware/createDevServerMiddleware';
import * as LoadingPageHandler from './middleware/LoadingPageHandler';
import { UrlCreator } from './UrlCreator';

/** Default port to use for apps running in Expo Go. */
const EXPO_GO_METRO_PORT = 19000;

/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */
const DEV_CLIENT_METRO_PORT = 8081;

export class MetroBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'metro';
  }
  async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    await this.stopAsync();

    const port =
      // If the manually defined port is busy then an error should be thrown...
      options.port ??
      // Otherwise use the default port based on the runtime target.
      (options.devClient
        ? // Don't check if the port is busy if we're using the dev client since most clients are hardcoded to 8081.
          Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT
        : // Otherwise (running in Expo Go) use a free port that falls back on the classic 19000 port.
          await getFreePortAsync(options.port || EXPO_GO_METRO_PORT));

    this.urlCreator = new UrlCreator(options.location, {
      port,
      getTunnelUrl: this.getTunnelUrl.bind(this),
    });

    const parsedOptions = {
      port,
      maxWorkers: options.maxWorkers,
      resetCache: options.resetDevServer,

      // Use the unversioned metro config.
      // TODO: Deprecate this property when expo-cli goes away.
      unversioned: false,
    };

    const { server, middleware, messageSocket } = await runMetroDevServerAsync(
      this.projectRoot,
      parsedOptions
    );

    const manifestMiddleware = this.getManifestMiddleware(options);

    // We need the manifest handler to be the first middleware to run so our
    // routes take precedence over static files. For example, the manifest is
    // served from '/' and if the user has an index.html file in their project
    // then the manifest handler will never run, the static middleware will run
    // and serve index.html instead of the manifest.
    // https://github.com/expo/expo/issues/13114
    prependMiddleware(middleware, manifestMiddleware);

    middleware.use(LoadingPageHandler.getLoadingPageHandler(this.projectRoot, this.urlCreator));

    // Extend the close method to ensure that we clean up the local info.
    const originalClose = server.close.bind(server);

    server.close = (callback?: (err?: Error) => void) => {
      return originalClose((err?: Error) => {
        this.instance = null;
        callback?.(err);
      });
    };

    this.setInstance({
      server,
      location: {
        // The port is the main thing we want to send back.
        port,
        // localhost isn't always correct.
        host: 'localhost',
        // http is the only supported protocol on native.
        url: `http://localhost:${port}`,
        protocol: 'http',
      },
      middleware,
      messageSocket,
    });

    await this.postStartAsync(options);

    return this.instance;
  }

  protected getConfigModuleIds(): string[] {
    return ['./metro.config.js', './metro.config.json', './rn-cli.config.js'];
  }
}

// From expo/dev-server but with ability to use custom logger.
type MessageSocket = {
  broadcast: (method: string, params?: Record<string, any> | undefined) => void;
};
class MetroImportError extends Error {
  constructor(projectRoot: string, moduleId: string) {
    super(
      `Missing package "${moduleId}" in the project at: ${projectRoot}\n` +
        'This usually means `react-native` is not installed. ' +
        'Please verify that dependencies in package.json include "react-native" ' +
        'and run `yarn` or `npm install`.'
    );
  }
}

function resolveFromProject(projectRoot: string, moduleId: string) {
  const resolvedPath = resolveFrom.silent(projectRoot, moduleId);
  if (!resolvedPath) {
    throw new MetroImportError(projectRoot, moduleId);
  }
  return resolvedPath;
}

function importFromProject(projectRoot: string, moduleId: string) {
  return require(resolveFromProject(projectRoot, moduleId));
}

export function importMetroFromProject(projectRoot: string): typeof Metro {
  return importFromProject(projectRoot, 'metro');
}

export function importExpoMetroConfigFromProject(
  projectRoot: string
): typeof import('@expo/metro-config') {
  return importFromProject(projectRoot, '@expo/metro-config');
}

async function runMetroDevServerAsync(
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

  const { middleware, attachToServer } = createDevServerMiddleware({
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

  const server = await Metro.runServer(metroConfig, { hmrEnabled: true });

  const { messageSocket, eventsSocket } = attachToServer(server);
  reportEvent = eventsSocket.reportEvent;

  return {
    server,
    middleware,
    messageSocket,
  };
}
