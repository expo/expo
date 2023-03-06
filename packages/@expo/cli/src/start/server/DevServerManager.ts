import { ExpoConfig, getConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';

import { FileNotifier } from '../../utils/FileNotifier';
import { logEventAsync } from '../../utils/analytics/rudderstackClient';
import { ProjectPrerequisite } from '../doctor/Prerequisite';
import { TypeScriptProjectPrerequisite } from '../doctor/typescript/TypeScriptProjectPrerequisite';
import * as AndroidDebugBridge from '../platforms/android/adb';
import { BundlerDevServer, BundlerStartOptions } from './BundlerDevServer';
import { getPlatformBundlers } from './platformBundlers';

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

  private notifier: FileNotifier | null = null;

  constructor(
    public projectRoot: string,
    /** Keep track of the original CLI options for bundlers that are started interactively. */
    public options: BundlerStartOptions
  ) {
    this.notifier = this.watchBabelConfig();
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
    const bundler = getPlatformBundlers(exp).web;
    debug(`Starting ${bundler} dev server for web`);
    return this.startAsync([
      {
        type: bundler,
        options: this.options,
      },
    ]);
  }

  /** Start all dev servers. */
  async startAsync(startOptions: MultiBundlerStartOptions): Promise<ExpoConfig> {
    const { exp } = getConfig(this.projectRoot);

    await logEventAsync('Start Project', {
      sdkVersion: exp.sdkVersion ?? null,
    });

    const platformBundlers = getPlatformBundlers(exp);

    // Start all dev servers...
    for (const { type, options } of startOptions) {
      const BundlerDevServerClass = await BUNDLERS[type]();
      const server = new BundlerDevServerClass(
        this.projectRoot,
        platformBundlers,
        !!options?.devClient
      );
      await server.startAsync(options ?? this.options);
      devServers.push(server);
    }

    return exp;
  }

  async bootstrapTypeScriptAsync() {
    if (await this.ensureProjectPrerequisiteAsync(TypeScriptProjectPrerequisite)) {
      return;
    }
    // Optionally, wait for the user to add TypeScript during the
    // development cycle.
    const server = devServers.find((server) => server.name === 'metro');
    if (!server) {
      return;
    }
    await server.waitForTypeScriptAsync();
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
