import { MessageSocket } from '@expo/dev-server';
import assert from 'assert';
import openBrowserAsync from 'better-opn';
import resolveFrom from 'resolve-from';

import { APISettings } from '../../api/settings';
import * as Log from '../../log';
import { FileNotifier } from '../../utils/FileNotifier';
import { env } from '../../utils/env';
import {
  BaseOpenInCustomProps,
  BaseResolveDeviceProps,
  PlatformManager,
} from '../platforms/PlatformManager';
import { AndroidPlatformManager } from '../platforms/android/AndroidPlatformManager';
import { ApplePlatformManager } from '../platforms/ios/ApplePlatformManager';
import { AsyncNgrok } from './AsyncNgrok';
import { DevelopmentSession } from './DevelopmentSession';
import { CreateURLOptions, UrlCreator } from './UrlCreator';
import { ClassicManifestMiddleware } from './middleware/ClassicManifestMiddleware';
import { ExpoGoManifestHandlerMiddleware } from './middleware/ExpoGoManifestHandlerMiddleware';
import { CommandError } from '../../utils/errors';

export type ServerLike = {
  close(callback?: (err?: Error) => void);
};

export type DevServerInstance = {
  /** Bundler dev server instance. */
  server: ServerLike;
  /** Dev server URL location properties. */
  location: {
    url: string;
    port: number;
    protocol: 'http' | 'https';
    host?: string;
  };
  /** Additional middleware that's attached to the `server`. */
  middleware: any;
  /** Message socket for communicating with the runtime. */
  messageSocket: MessageSocket;
};

export interface BundlerStartOptions {
  /** Should the dev server use `https` protocol. */
  https?: boolean;
  /** Should start the dev servers in development mode (minify). */
  mode?: 'development' | 'production';
  /** Is dev client enabled. */
  devClient?: boolean;
  /** Should run dev servers with clean caches. */
  resetDevServer?: boolean;
  /** Which manifest type to serve. */
  forceManifestType?: 'expo-updates' | 'classic';

  /** Max amount of workers (threads) to use with Metro bundler, defaults to undefined for max workers. */
  maxWorkers?: number;
  /** Port to start the dev server on. */
  port?: number;

  /** Should start a headless dev server e.g. mock representation to approximate info from a server running in a different process. */
  headless?: boolean;
  /** Should instruct the bundler to create minified bundles. */
  minify?: boolean;

  // Webpack options
  /** Should modify and create PWA icons. */
  isImageEditingEnabled?: boolean;

  location: CreateURLOptions;
}

const PLATFORM_MANAGERS = {
  simulator: ApplePlatformManager,
  emulator: AndroidPlatformManager,
};

const MIDDLEWARES = {
  classic: ClassicManifestMiddleware,
  'expo-updates': ExpoGoManifestHandlerMiddleware,
};

export abstract class BundlerDevServer {
  /** Name of the bundler. */
  abstract get name(): string;

  /** Ngrok instance for managing tunnel connections. */
  protected ngrok: AsyncNgrok | null = null;
  /** Interfaces with the Expo 'Development Session' API. */
  protected devSession: DevelopmentSession | null = null;
  /** Http server and related info. */
  protected instance: DevServerInstance | null = null;
  /** Native platform interfaces for opening projects.  */
  private platformManagers: Record<string, PlatformManager<any>> = {};
  /** Manages the creation of dev server URLs. */
  protected urlCreator?: UrlCreator | null = null;

  constructor(
    /** Project root folder. */
    public projectRoot: string,
    // TODO: Replace with custom scheme maybe...
    public isDevClient?: boolean
  ) {}

  protected setInstance(instance: DevServerInstance) {
    this.instance = instance;
  }

  /** Get the manifest middleware function. Exposed for testing. */
  public _getManifestMiddleware(
    options: Pick<BundlerStartOptions, 'minify' | 'mode' | 'forceManifestType'> = {}
  ) {
    const manifestType = options.forceManifestType || 'classic';
    const Middleware = MIDDLEWARES[manifestType];
    assert(Middleware, `Manifest middleware for type '${manifestType}' not found`);

    const urlCreator = this.getUrlCreator();
    const middleware = new Middleware(this.projectRoot, {
      constructUrl: urlCreator.constructUrl.bind(urlCreator),
      mode: options.mode,
      minify: options.minify,
      isNativeWebpack: this.name === 'webpack' && this.isTargetingNative(),
    });
    return middleware.getHandler();
  }

  /** Start the dev server using settings defined in the start command. */
  public async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    await this.stopAsync();

    let instance: DevServerInstance;
    if (options.headless) {
      instance = await this.startHeadlessAsync(options);
    } else {
      instance = await this.startImplementationAsync(options);
    }

    this.setInstance(instance);
    await this.postStartAsync(options);
    return instance;
  }

  protected abstract startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance>;

  /**
   * Creates a mock server representation that can be used to estimate URLs for a server started in another process.
   * This is used for the run commands where you can reuse the server from a previous run.
   */
  private async startHeadlessAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    if (!options.port)
      throw new CommandError('HEADLESS_SERVER', 'headless dev server requires a port option');
    this.urlCreator = this.getUrlCreator(options);

    return {
      // Create a mock server
      server: {
        close: () => {
          this.instance = null;
        },
      },
      location: {
        // The port is the main thing we want to send back.
        port: options.port,
        // localhost isn't always correct.
        host: 'localhost',
        // http is the only supported protocol on native.
        url: `http://localhost:${options.port}`,
        protocol: 'http',
      },
      middleware: {},
      messageSocket: {
        broadcast: () => {
          throw new CommandError('HEADLESS_SERVER', 'Cannot broadcast messages to headless server');
        },
      },
    };
  }

  protected async postStartAsync(options: BundlerStartOptions) {
    if (options.location.hostType === 'tunnel' && !APISettings.isOffline) {
      await this._startTunnelAsync();
    }
    await this.startDevSessionAsync();

    this.watchConfig();
  }

  protected abstract getConfigModuleIds(): string[];

  protected watchConfig() {
    const notifier = new FileNotifier(this.projectRoot, this.getConfigModuleIds());
    notifier.startObserving();
  }

  /** Create ngrok instance and start the tunnel server. Exposed for testing. */
  public async _startTunnelAsync(): Promise<AsyncNgrok | null> {
    const port = this.getInstance()?.location.port;
    if (!port) return null;
    Log.debug('[ngrok] connect to port: ' + port);
    this.ngrok = new AsyncNgrok(this.projectRoot, port);
    await this.ngrok.startAsync();
    return this.ngrok;
  }

  protected async startDevSessionAsync() {
    // This is used to make Expo Go open the project in either Expo Go, or the web browser.
    // Must come after ngrok (`startTunnelAsync`) setup.

    if (this.devSession) {
      this.devSession.stop();
    }

    this.devSession = new DevelopmentSession(
      this.projectRoot,
      // This URL will be used on external devices so the computer IP won't be relevant.
      this.isTargetingNative()
        ? this.getNativeRuntimeUrl()
        : this.getDevServerUrl({ hostType: 'localhost' })
    );

    await this.devSession.startAsync({
      runtime: this.isTargetingNative() ? 'native' : 'web',
    });
  }

  public isTargetingNative() {
    // Temporary hack while we implement multi-bundler dev server proxy.
    return true;
  }

  public isTargetingWeb() {
    return false;
  }

  /**
   * Sends a message over web sockets to any connected device,
   * does nothing when the dev server is not running.
   *
   * @param method name of the command. In RN projects `reload`, and `devMenu` are available. In Expo Go, `sendDevCommand` is available.
   * @param params
   */
  public broadcastMessage(
    method: 'reload' | 'devMenu' | 'sendDevCommand',
    params?: Record<string, any>
  ) {
    this.getInstance()?.messageSocket.broadcast(method, params);
  }

  /** Get the running dev server instance. */
  public getInstance() {
    return this.instance;
  }

  /** Stop the running dev server instance. */
  async stopAsync() {
    // Stop the dev session timer.
    this.devSession?.stop();

    // Stop ngrok if running.
    await this.ngrok?.stopAsync().catch((e) => {
      Log.error(`Error stopping ngrok:`);
      Log.exception(e);
    });

    return new Promise<void>((resolve, reject) => {
      // Close the server.
      if (this.instance?.server) {
        this.instance.server.close((error) => {
          this.instance = null;
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      } else {
        this.instance = null;
        resolve();
      }
    });
  }

  protected getUrlCreator(options: Partial<Pick<BundlerStartOptions, 'port' | 'location'>> = {}) {
    if (!this.urlCreator) {
      assert(options?.port, 'Dev server instance not found');
      this.urlCreator = new UrlCreator(options.location, {
        port: options.port,
        getTunnelUrl: this.getTunnelUrl.bind(this),
      });
    }
    return this.urlCreator;
  }

  public getNativeRuntimeUrl(opts: Partial<CreateURLOptions> = {}) {
    return this.isDevClient
      ? this.getUrlCreator().constructDevClientUrl(opts) ?? this.getDevServerUrl()
      : this.getUrlCreator().constructUrl({ ...opts, scheme: 'exp' });
  }

  /** Get the URL for the running instance of the dev server. */
  public getDevServerUrl(options: { hostType?: 'localhost' } = {}): string | null {
    if (!this.getInstance()?.location) {
      return null;
    }
    const { location } = this.getInstance();
    if (options.hostType === 'localhost') {
      return `${location.protocol}://localhost:${location.port}`;
    }
    return location.url ?? null;
  }

  /** Get the tunnel URL from ngrok. */
  public getTunnelUrl(): string | null {
    return this.ngrok?.getActiveUrl() ?? null;
  }

  /** Open the dev server in a runtime. */
  public async openPlatformAsync(
    launchTarget: keyof typeof PLATFORM_MANAGERS | 'desktop',
    resolver: BaseResolveDeviceProps<any> = {}
  ) {
    if (launchTarget === 'desktop') {
      const url = this.getDevServerUrl({ hostType: 'localhost' });
      await openBrowserAsync(url);
      return { url };
    }

    const runtime = this.isTargetingNative() ? (this.isDevClient ? 'custom' : 'expo') : 'web';
    const manager = this.getPlatformManager(launchTarget);
    return manager.openAsync({ runtime }, resolver);
  }

  /** Open the dev server in a runtime. */
  public async openCustomRuntimeAsync(
    launchTarget: keyof typeof PLATFORM_MANAGERS,
    launchProps: Partial<BaseOpenInCustomProps> = {},
    resolver: BaseResolveDeviceProps<any> = {}
  ) {
    const runtime = this.isTargetingNative() ? (this.isDevClient ? 'custom' : 'expo') : 'web';
    if (runtime !== 'custom') {
      throw new CommandError(
        `dev server cannot open custom runtimes either because it does not target native platforms or because it is not targetting dev clients. (target: ${runtime})`
      );
    }

    const manager = this.getPlatformManager(launchTarget);
    return manager.openAsync({ runtime: 'custom', props: launchProps }, resolver);
  }

  /** Should use the interstitial page for selecting which runtime to use. */
  protected shouldUseInterstitialPage(): boolean {
    return (
      env.EXPO_ENABLE_INTERSTITIAL_PAGE &&
      // Checks if dev client is installed.
      !!resolveFrom.silent(this.projectRoot, 'expo-dev-launcher')
    );
  }

  /** Get the URL for opening in Expo Go. */
  protected getExpoGoUrl(platform: keyof typeof PLATFORM_MANAGERS) {
    if (this.shouldUseInterstitialPage()) {
      const loadingUrl =
        platform === 'emulator'
          ? this.urlCreator.constructLoadingUrl({}, 'android')
          : this.urlCreator.constructLoadingUrl({ hostType: 'localhost' }, 'ios');
      return loadingUrl;
    }

    return this.urlCreator.constructUrl({ scheme: 'exp' });
  }

  protected getPlatformManager(platform: keyof typeof PLATFORM_MANAGERS) {
    if (!this.platformManagers[platform]) {
      const Manager = PLATFORM_MANAGERS[platform];
      this.platformManagers[platform] = new Manager(
        this.projectRoot,
        this.getInstance()?.location.port,
        {
          getCustomRuntimeUrl: this.urlCreator.constructDevClientUrl.bind(this.urlCreator),
          getExpoGoUrl: this.getExpoGoUrl.bind(this, platform),
          getDevServerUrl: this.getDevServerUrl.bind(this, { hostType: 'localhost' }),
        }
      );
    }
    return this.platformManagers[platform];
  }
}
