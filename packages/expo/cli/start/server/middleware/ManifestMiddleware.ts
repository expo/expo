import { ExpoAppManifest, ExpoGoConfig } from '@expo/config';
import express from 'express';
import http from 'http';

import { UnimplementedError } from '../../../utils/errors';
import { BundlerStartOptions } from '../BundlerDevServer';
import { UrlCreator } from '../UrlCreator';

export interface HostInfo {
  host: string;
  server: 'expo';
  serverVersion: string;
  serverDriver: string | null;
  serverOS: NodeJS.Platform;
  serverOSVersion: string;
}

export const DEVELOPER_TOOL = 'expo-cli';

export class ManifestHandlerMiddleware {
  constructor(
    protected projectRoot: string,
    protected options: Pick<BundlerStartOptions, 'mode' | 'minify'> & {
      constructUrl: UrlCreator['constructUrl'];
      isNativeWebpack?: boolean;
    }
  ) {}

  protected getBundleUrl({
    platform,
    mainModuleName,
    hostname,
  }: {
    platform: string;
    hostname?: string;
    mainModuleName: string;
  }): string {
    const queryParams = new URLSearchParams({
      platform: encodeURIComponent(platform),
      dev: String(this.options.mode === 'development'),
      hot: String(false),
    });

    if (this.options.minify) {
      queryParams.append('minify', String(this.options.minify));
    }

    const path = `/${encodeURI(mainModuleName)}.bundle?${queryParams.toString()}`;

    return (
      this.options.constructUrl({
        scheme: 'http',
        // hostType: this.options.location.hostType,
        hostname,
      }) + path
    );
  }

  async getManifestResponseAsync(): Promise<{
    manifest: ExpoAppManifest;
    manifestString: string;
    hostInfo: HostInfo;
  }> {
    throw new UnimplementedError();
  }

  protected getExpoGoConfig({
    projectRoot,
    packagerOpts,
    mainModuleName,
    hostname,
  }: {
    projectRoot: string;
    packagerOpts: {
      // Required for dev client.
      dev: boolean;
    };
    mainModuleName: string;
    hostname: string | undefined;
  }): ExpoGoConfig {
    // localhost:19000
    const debuggerHost = this.options.constructUrl({ scheme: '', hostname });
    // http://localhost:19000/logs
    const logUrl = this.options.constructUrl({ scheme: 'http', hostname }) + '/logs';

    return {
      // Required for Expo Go to function.
      developer: {
        tool: DEVELOPER_TOOL,
        projectRoot,
      },
      packagerOpts,
      mainModuleName,
      // Add this string to make Flipper register React Native / Metro as "running".
      // Can be tested by running:
      // `METRO_SERVER_PORT=19000 open -a flipper.app`
      // Where 19000 is the port where the Expo project is being hosted.
      __flipperHack: 'React Native packager is running',
      debuggerHost,
      logUrl,
    };
  }

  public getHandler(): (
    req: express.Request | http.IncomingMessage,
    res: express.Response | http.ServerResponse,
    next: (err?: Error) => void
  ) => Promise<void> {
    throw new UnimplementedError();
  }
}
