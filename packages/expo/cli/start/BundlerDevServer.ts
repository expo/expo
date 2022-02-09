import { ExpoConfig, ProjectTarget } from '@expo/config';
import { MessageSocket } from '@expo/dev-server';

import * as Log from '../log';

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
  port?: number;
  host?: string;
  https?: boolean;

  mode?: 'development' | 'production';
  resetDevServer?: boolean;

  forceManifestType: 'classic' | 'expo-updates';

  // Metro options
  devClient?: boolean;
  maxWorkers?: number;

  // Webpack options
  isImageEditingEnabled?: boolean;
}

export class BundlerDevServer {
  constructor(public projectRoot: string) {}

  protected instance: DevServerInstance | null = null;

  setInstance(instance: DevServerInstance) {
    this.instance = instance;
  }

  /** Start the dev server using settings defined in the start command. */
  async startAsync(options: BundlerStartOptions): Promise<DevServerInstance> {
    throw new Error('unimplemented');
  }

  isTargetingNative() {
    // Temporary hack while we implement multi-bundler dev server proxy.
    return true;
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
    return new Promise<void>((resolve, reject) => {
      if (this.instance?.server) {
        Log.log('\u203A Stopping server');
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

  /**
   * Get the URL for the running instance of Webpack dev server.
   */
  getDevServerUrl(options: { hostType?: 'localhost' } = {}): string | null {
    if (!this.instance?.location) {
      return null;
    }
    const { location } = this.instance;
    if (options.hostType === 'localhost') {
      return `${location.protocol}://localhost:${location.port}`;
    }
    return location?.url ?? null;
  }
}
