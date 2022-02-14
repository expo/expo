import { ExpoAppManifest, ExpoGoConfig } from '@expo/config';
import express from 'express';
import http from 'http';

import { UnimplementedError } from '../../../utils/errors';
import { UrlCreator, URLOptions } from '../UrlCreator';

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
    protected urlCreator: UrlCreator,
    protected options: { location: Omit<URLOptions, 'urlType'>; isNativeWebpack?: boolean }
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
    const queryParams = this.urlCreator.constructBundleQueryParams({
      dev: this.options.location.mode === 'development',
      minify: this.options.location.minify,
    });

    const path = `/${encodeURI(mainModuleName)}.bundle?platform=${encodeURIComponent(
      platform
    )}&${queryParams}`;

    return (
      this.urlCreator.constructBundleUrl(
        {
          hostType: this.options.location.hostType,
          scheme: this.options.location.scheme,
          minify: this.options.location.minify,
          mode: this.options.location.mode,
          urlType: 'http',

          // urlType: ??
        },
        hostname
      ) + path
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
    const debuggerHost = this.urlCreator.constructDebuggerHost(hostname);
    const logUrl = this.urlCreator.constructLogUrl(hostname);
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
