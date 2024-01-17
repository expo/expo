import { ExpoConfig, getConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';

import { BundlerDevServer, BundlerStartOptions } from './BundlerDevServer';
import DevToolsPluginManager from './DevToolsPluginManager';
import { getPlatformBundlers } from './platformBundlers';
import { Log } from '../../log';
import { FileNotifier } from '../../utils/FileNotifier';
import { logEventAsync } from '../../utils/analytics/rudderstackClient';
import { env } from '../../utils/env';
import { ProjectPrerequisite } from '../doctor/Prerequisite';
import { TypeScriptProjectPrerequisite } from '../doctor/typescript/TypeScriptProjectPrerequisite';
import { printItem } from '../interface/commandsTable';
import * as AndroidDebugBridge from '../platforms/android/adb';
import { resolveSchemeAsync } from '../resolveOptions';

const debug = require('debug')('expo:start:server:devServerManager') as typeof console.log;

export type MultiBundlerStartOptions = {
  type: keyof typeof BUNDLERS;
  options?: BundlerStartOptions;
}[];

const devServers: BundlerDevServer[] = [];

const BUNDLERS = {
  webpack: () =>
    require('./webpack/WebpackBundlerDevServer')
      .WebpackBundlerDevServer as typeof import('./webpack/WebpackBundlerDevServer').WebpackBundlerDevServer,
  metro: () =>
    require('./metro/MetroBundlerDevServer')
      .MetroBundlerDevServer as typeof import('./metro/MetroBundlerDevServer').MetroBundlerDevServer,
};

/** Manages interacting with multiple dev servers. */
export class DevServerManager {
  private projectPrerequisites: ProjectPrerequisite<any, void>[] = [];
  public readonly devtoolsPluginManager: DevToolsPluginManager;

  private notifier: FileNotifier | null = null;

  constructor(
    public projectRoot: string,
    /** Keep track of the original CLI options for bundlers that are started interactively. */
    public options: BundlerStartOptions
  ) {
    this.notifier = this.watchBabelConfig();
    this.devtoolsPluginManager = new DevToolsPluginManager(projectRoot);
  }

  private watchBabelConfig() {
    const notifier = new FileNotifier(
      this.projectRoot,
      [
        './babel.config.js',
        './babel.config.json',
        './.babelrc.json',
        './.babelrc',
        './.babelrc.js',
      ],
      {
        additionalWarning: chalk` You may need to clear the bundler cache with the {bold --clear} flag for your changes to take effect.`,
      }
    );

    notifier.startObserving();

    return notifier;
  }

  /** Lazily load and assert a project-level prerequisite. */
  async ensureProjectPrerequisiteAsync(PrerequisiteClass: typeof ProjectPrerequisite<any, any>) {
    let prerequisite = this.projectPrerequisites.find(
      (prerequisite) => prerequisite instanceof PrerequisiteClass
    );
    if (!prerequisite) {
      prerequisite = new PrerequisiteClass(this.projectRoot);
      this.projectPrerequisites.push(prerequisite);
    }
    return await prerequisite.assertAsync();
  }

  /**
   * Sends a message over web sockets to all connected devices,
   * does nothing when the dev server is not running.
   *
   * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
   * @param params extra event info to send over the socket.
   */
  broadcastMessage(method: 'reload' | 'devMenu' | 'sendDevCommand', params?: Record<string, any>) {
    devServers.forEach((server) => {
      server.broadcastMessage(method, params);
    });
  }

  /** Get the port for the dev server (either Webpack or Metro) that is hosting code for React Native runtimes. */
  getNativeDevServerPort() {
    const server = devServers.find((server) => server.isTargetingNative());
    return server?.getInstance()?.location.port ?? null;
  }

  /** Get the first server that targets web. */
  getWebDevServer() {
    const server = devServers.find((server) => server.isTargetingWeb());
    return server ?? null;
  }

  getDefaultDevServer(): BundlerDevServer {
    // Return the first native dev server otherwise return the first dev server.
    const server = devServers.find((server) => server.isTargetingNative());
    const defaultServer = server ?? devServers[0];
    assert(defaultServer, 'No dev servers are running');
    return defaultServer;
  }

  async ensureWebDevServerRunningAsync() {
    const [server] = devServers.filter((server) => server.isTargetingWeb());
    if (server) {
      return;
    }
    const { exp } = getConfig(this.projectRoot, {
      skipPlugins: true,
      skipSDKVersionRequirement: true,
    });
    const bundler = getPlatformBundlers(this.projectRoot, exp).web;
    debug(`Starting ${bundler} dev server for web`);
    return this.startAsync([
      {
        type: bundler,
        options: this.options,
      },
    ]);
  }

  /** Switch between Expo Go and Expo Dev Clients. */
  async toggleRuntimeMode(isUsingDevClient: boolean = !this.options.devClient): Promise<boolean> {
    const nextMode = isUsingDevClient ? '--dev-client' : '--go';
    Log.log(printItem(chalk`Switching to {bold ${nextMode}}`));

    const nextScheme = await resolveSchemeAsync(this.projectRoot, {
      devClient: isUsingDevClient,
      // NOTE: The custom `--scheme` argument is lost from this point on.
    });

    this.options.location.scheme = nextScheme;
    this.options.devClient = isUsingDevClient;
    for (const devServer of devServers) {
      devServer.isDevClient = isUsingDevClient;
      const urlCreator = devServer.getUrlCreator();
      urlCreator.defaults ??= {};
      urlCreator.defaults.scheme = nextScheme;
    }

    debug(`New runtime options (runtime: ${nextMode}):`, this.options);
    return true;
  }

  /** Start all dev servers. */
  async startAsync(startOptions: MultiBundlerStartOptions): Promise<ExpoConfig> {
    const { exp } = getConfig(this.projectRoot, { skipSDKVersionRequirement: true });

    await logEventAsync('Start Project', {
      sdkVersion: exp.sdkVersion ?? null,
    });

    const platformBundlers = getPlatformBundlers(this.projectRoot, exp);

    // Start all dev servers...
    for (const { type, options } of startOptions) {
      const BundlerDevServerClass = await BUNDLERS[type]();
      const server = new BundlerDevServerClass(this.projectRoot, platformBundlers, {
        devToolsPluginManager: this.devtoolsPluginManager,
        isDevClient: !!options?.devClient,
      });
      await server.startAsync(options ?? this.options);
      devServers.push(server);
    }

    return exp;
  }

  async bootstrapTypeScriptAsync() {
    const typescriptPrerequisite = await this.ensureProjectPrerequisiteAsync(
      TypeScriptProjectPrerequisite
    );

    if (env.EXPO_NO_TYPESCRIPT_SETUP) {
      return;
    }

    // Optionally, wait for the user to add TypeScript during the
    // development cycle.
    const server = devServers.find((server) => server.name === 'metro');
    if (!server) {
      return;
    }

    // The dev server shouldn't wait for the typescript services
    if (!typescriptPrerequisite) {
      server.waitForTypeScriptAsync().then(async (success) => {
        if (success) {
          server.startTypeScriptServices();
        }
      });
    } else {
      server.startTypeScriptServices();
    }
  }

  async watchEnvironmentVariables() {
    await devServers.find((server) => server.name === 'metro')?.watchEnvironmentVariables();
  }

  /** Stop all servers including ADB. */
  async stopAsync(): Promise<void> {
    await Promise.allSettled([
      this.notifier?.stopObserving(),
      // Stop all dev servers
      ...devServers.map((server) => server.stopAsync()),
      // Stop ADB
      AndroidDebugBridge.getServer().stopAsync(),
    ]);
  }
}
