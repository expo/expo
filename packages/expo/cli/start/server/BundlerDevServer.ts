import { ExpoConfig } from '@expo/config-types';
import { MessageSocket } from '@expo/dev-server';
import assert from 'assert';
import openBrowserAsync from 'better-opn';
import resolveFrom from 'resolve-from';

import * as Log from '../../log';
import { FileNotifier } from '../../utils/FileNotifier';
import { UnimplementedError } from '../../utils/errors';
import { ProcessSettings } from '../ProcessSettings';
import { BaseResolveDeviceProps, PlatformManager } from '../platforms/PlatformManager';
import { AndroidPlatformManager } from '../platforms/android/AndroidPlatformManager';
import { ApplePlatformManager } from '../platforms/ios/ApplePlatformManager';
import { AsyncNgrok } from './AsyncNgrok';
import { DevelopmentSession } from './DevelopmentSession';
import { CreateURLOptions, UrlCreator } from './UrlCreator';
import { ClassicManifestMiddleware } from './middleware/ClassicManifestMiddleware';
import { ExpoGoManifestHandlerMiddleware } from './middleware/ExpoUpdatesManifestMiddleware';

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
  /** Which manifest handler to use. */
  forceManifestType?: 'expo-updates' | 'classic';

  /** Max amount of workers (threads) to use with Metro bundler, defaults to undefined for max workers. */
  maxWorkers?: number;
  /** Port to start the dev server on. */
  port?: number;
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

export class BundlerDevServer {
  /** Name of the bundler. */
  get name(): string {
    throw new UnimplementedError();
  }

  /** Ngrok instance for managing tunnel connections. */
  private ngrok: AsyncNgrok | null = null;
  /** Interfaces with the Expo 'Development Session' API. */
  private devSession: DevelopmentSession | null = null;
  /** Http server and related info. */
  protected instance: DevServerInstance | null = null;
  /** Native platform interfaces for opening projects.  */
  private platformManagers: Record<string, PlatformManager<any>> = {};
  /** Manages the creation of dev server URLs. */
  protected urlCreator?: UrlCreator | null = null;

  constructor(
    /** Project root folder. */
    public projectRoot: string,
    /** Single instance of the Expo config to pass around. */
    protected exp: ExpoConfig,
    // TODO: Replace with custom scheme maybe...
    public isDevClient?: boolean
  ) {}

  protected setInstance(instance: DevServerInstance) {
    this.instance = instance;
  }

  protected getManifestMiddleware(
    options: Pick<BundlerStartOptions, 'location' | 'minify' | 'mode' | 'forceManifestType'>
  ) {
    const Middleware = MIDDLEWARES[options.forceManifestType || 'classic'];
    assert(Middleware, `Manifest middleware for type '${options.forceManifestType}' not found`);
    const middleware = new Middleware(this.projectRoot, {
      constructUrl: this.urlCreator.constructUrl.bind(this.urlCreator),
      mode: options.mode,
      minify: options.minify,
      isNativeWebpack: this.name === 'webpack' && this.isTargetingNative(),
    });
    return middleware.getHandler();
  }

  /** Start the dev server using settings defined in the start command. */
  public async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    throw new UnimplementedError();
  }

  protected async postStartAsync(options: BundlerStartOptions) {
    if (options.location.hostType === 'tunnel' && !ProcessSettings.isOffline) {
      await this.startTunnelAsync();
    }
    await this.startDevSessionAsync();

    this.watchConfig();
  }

  protected getConfigModuleIds(): string[] {
    throw new UnimplementedError();
  }

  protected watchConfig() {
    const notifier = new FileNotifier(this.projectRoot, this.getConfigModuleIds());
    notifier.startObserving();
  }

  protected async startTunnelAsync() {
    const port = this.getInstance()?.location?.port;
    if (!port) return;
    Log.debug('[tunnel] connect to port: ' + port);
    this.ngrok = new AsyncNgrok(this.projectRoot, port);
    await this.ngrok.startAsync();
  }

  protected async startDevSessionAsync() {
    // This is used to make Expo Go open the project in either Expo Go, or the web browser.
    // Must come after ngrok (`startTunnelAsync`) setup.

    if (this.devSession) {
      this.devSession.stopSession();
    }

    this.devSession = new DevelopmentSession(
      this.projectRoot,
      // This URL will be used on external devices so the computer IP won't be relevant.
      this.getDevServerUrl({ hostType: 'localhost' })
    );

    await this.devSession.startDevSessionAsync({
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
    this.instance?.messageSocket?.broadcast?.(method, params);
  }

  /** Get the running dev server instance. */
  public getInstance() {
    return this.instance;
  }

  /** Stop the running dev server instance. */
  async stopAsync() {
    // Stop the dev session timer.
    this.devSession?.stopSession?.();

    // Stop ngrok if running.
    await this.ngrok?.stopAsync?.().catch((e) => {
      Log.error(`Error stopping ngrok: ${e.message}`);
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
        resolve();
      }
    });
  }

  public getNativeRuntimeUrl(opts: Partial<CreateURLOptions> = {}) {
    return this.isDevClient
      ? this.urlCreator.constructDevClientUrl(opts) ?? this.getDevServerUrl()
      : this.urlCreator.constructUrl({ ...opts, scheme: 'exp' });
  }

  /** Get the URL for the running instance of the dev server. */
  public getDevServerUrl(options: { hostType?: 'localhost' } = {}): string | null {
    if (!this.instance?.location) {
      return null;
    }
    const { location } = this.instance;
    if (options.hostType === 'localhost') {
      return `${location.protocol}://localhost:${location.port}`;
    }
    return location?.url ?? null;
  }

  /** Get the tunnel URL from ngrok. */
  public getTunnelUrl(): string | null {
    return this.ngrok?.getActiveUrl?.() ?? null;
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

  /** Should use the interstitial page for selecting which runtime to use. Exposed for testing. */
  private shouldUseInterstitialPage(): boolean {
    return (
      process.env.EXPO_ENABLE_INTERSTITIAL_PAGE &&
      // TODO: >:0
      // Checks if dev client is installed.
      !!resolveFrom.silent(this.projectRoot, 'expo-dev-launcher')
    );
  }

  private getExpoGoUrl(platform: keyof typeof PLATFORM_MANAGERS) {
    if (this.shouldUseInterstitialPage()) {
      const loadingUrl =
        platform === 'emulator'
          ? this.urlCreator.constructLoadingUrl({}, 'android')
          : this.urlCreator.constructLoadingUrl({ hostType: 'localhost' }, 'ios');
      return loadingUrl;
    }

    return this.urlCreator.constructUrl({ scheme: 'exp' });
  }

  private getPlatformManager(platform: keyof typeof PLATFORM_MANAGERS) {
    if (!this.platformManagers[platform]) {
      const Manager = PLATFORM_MANAGERS[platform];
      this.platformManagers[platform] = new Manager(
        this.projectRoot,
        this.getInstance()?.location?.port,
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
