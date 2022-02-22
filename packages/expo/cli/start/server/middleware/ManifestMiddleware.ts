import { ExpoGoConfig, ProjectConfig, ExpoConfig, getConfig } from '@expo/config';
import express from 'express';
import http from 'http';
import { resolve, parse } from 'url';

import * as Log from '../../../log';
import { CommandError, UnimplementedError } from '../../../utils/errors';
import { stripExtension } from '../../../utils/url';
import * as ProjectDevices from '../../project/ProjectDevices';
import { BundlerStartOptions } from '../BundlerDevServer';
import { UrlCreator } from '../UrlCreator';
import { resolveGoogleServicesFile, resolveManifestAssets } from './resolveAssets';
import { resolveEntryPoint } from './resolveEntryPoint';

/** Info about the computer hosting the dev server. */
export interface HostInfo {
  host: string;
  server: 'expo';
  serverVersion: string;
  serverDriver: string | null;
  serverOS: NodeJS.Platform;
  serverOSVersion: string;
}

/** Parsed values from the supported request headers. */
export interface ParsedHeaders {
  /** Should return the signed manifest. */
  acceptSignature: boolean;
  /** Platform to serve. */
  platform: 'android' | 'ios';
  /** Requested host name. */
  hostname?: string;
}

/** Project related info. */
export type ResponseProjectSettings = {
  expoGoConfig: ExpoGoConfig;
  hostUri: string;
  bundleUrl: string;
  exp: ExpoConfig;
};

/** Headers */
export type ServerHeaders = Map<string, number | string | readonly string[]>;
/** Request */
export type ServerRequest = express.Request | http.IncomingMessage;
/** Response */
export type ServerResponse = express.Response | http.ServerResponse;
/** Next function */
export type ServerNext = (err?: Error) => void;
/** Supported platforms */
export type RuntimePlatform = 'ios' | 'android';

export const DEVELOPER_TOOL = 'expo-cli';

/** Extract the runtime platform from the server request.  */
export function parsePlatformHeader(req: ServerRequest): string {
  const url = req.url ? parse(req.url, /* parseQueryString */ true) : null;
  const platform =
    url?.query.platform || req.headers['expo-platform'] || req.headers['exponent-platform'];
  return Array.isArray(platform) ? platform[0] : platform;
}

/** Assert if the runtime platform is not included. */
export function assertMissingRuntimePlatform(platform?: any): asserts platform {
  if (!platform) {
    throw new CommandError(
      'PLATFORM_HEADER',
      "Must specify 'expo-platform' header or 'platform' query parameter"
    );
  }
}

/** Assert if the runtime platform is not correct. */
export function assertRuntimePlatform(platform: string): asserts platform is RuntimePlatform {
  const stringifiedPlatform = String(platform);
  if (!['android', 'ios'].includes(stringifiedPlatform)) {
    throw new CommandError(
      'PLATFORM_HEADER',
      `platform must be "android" or "ios". Received: "${platform}"`
    );
  }
}

export class ManifestHandlerMiddleware {
  constructor(
    protected projectRoot: string,
    protected options: Pick<BundlerStartOptions, 'mode' | 'minify'> & {
      constructUrl: UrlCreator['constructUrl'];
      isNativeWebpack?: boolean;
    }
  ) {}

  protected getDefaultResponseHeaders(): Map<string, any> {
    return new Map<string, any>();
  }

  protected async resolveProjectSettingsAsync({
    platform,
    hostname,
  }: Pick<ParsedHeaders, 'hostname' | 'platform'>): Promise<ResponseProjectSettings> {
    // Read the config
    const projectConfig = getConfig(this.projectRoot);

    // Read from headers
    const mainModuleName = this.resolveMainModuleName(projectConfig, platform);

    // Create the manifest and set fields within it
    const expoGoConfig = this.getExpoGoConfig({
      mainModuleName,
      hostname,
    });

    const hostUri = this.options.constructUrl({ scheme: '', hostname });

    const bundleUrl = this.getBundleUrl({
      platform,
      mainModuleName,
      hostname,
    });

    // Resolve all assets and set them on the manifest as URLs
    await this.mutateManifestWithAssetsAsync(projectConfig.exp, bundleUrl);

    return {
      expoGoConfig,
      hostUri,
      bundleUrl,
      exp: projectConfig.exp,
    };
  }

  /** Only support `/`, `/manifest`, `/index.exp` for the manifest middleware. */
  private shouldContinue(req: ServerRequest): boolean {
    return (
      !req.url ||
      !['/', '/manifest', '/index.exp'].includes(
        // Strip the query params
        parse(req.url).pathname || req.url
      )
    );
  }

  private resolveMainModuleName(projectConfig: ProjectConfig, platform: string) {
    let entryPoint = resolveEntryPoint(this.projectRoot, platform, projectConfig);
    // NOTE(Bacon): Webpack is currently hardcoded to index.bundle on native
    // in the future (TODO) we should move this logic into a Webpack plugin and use
    // a generated file name like we do on web.
    // const server = getDefaultDevServer();
    // // TODO: Move this into BundlerDevServer and read this info from self.
    // const isNativeWebpack = server instanceof WebpackBundlerDevServer && server.isTargetingNative();
    if (this.options.isNativeWebpack) {
      entryPoint = 'index.js';
    }

    return stripExtension(entryPoint, 'js');
  }

  /** Parse request headers into options. */
  public getParsedHeaders(req: ServerRequest): ParsedHeaders {
    throw new UnimplementedError();
  }

  /** Store device IDs that were sent in the request headers. */
  private async saveDevicesAsync(req: ServerRequest) {
    const deviceIds = req.headers['expo-dev-client-id'];
    if (deviceIds) {
      await ProjectDevices.saveDevicesAsync(this.projectRoot, deviceIds).catch((e) =>
        Log.error(e.stack)
      );
    }
  }

  /** Create the bundle URL (points to the single JS entry file). */
  private getBundleUrl({
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

  /** Log telemetry. */
  protected trackManifest(version?: string) {
    throw new UnimplementedError();
  }

  /** Get the manifest response to return to the runtime. This file contains info regarding where the assets can be loaded from. */
  protected async getManifestResponseAsync(req: ServerRequest): Promise<{
    body: string;
    version: string;
    headers: ServerHeaders;
  }> {
    throw new UnimplementedError();
  }

  private getExpoGoConfig({
    mainModuleName,
    hostname,
  }: {
    mainModuleName: string;
    hostname: string | undefined;
  }): ExpoGoConfig {
    return {
      // localhost:19000
      debuggerHost: this.options.constructUrl({ scheme: '', hostname }),
      // http://localhost:19000/logs -- used to send logs to the CLI for displaying in the terminal.
      // This is deprecated in favor of the WebSocket connection setup in Metro.
      logUrl: this.options.constructUrl({ scheme: 'http', hostname }) + '/logs',
      // Required for Expo Go to function.
      developer: {
        tool: DEVELOPER_TOOL,
        projectRoot: this.projectRoot,
      },
      packagerOpts: {
        // Required for dev client.
        dev: this.options.mode === 'development',
      },
      // Indicates the name of the main bundle.
      mainModuleName,
      // Add this string to make Flipper register React Native / Metro as "running".
      // Can be tested by running:
      // `METRO_SERVER_PORT=19000 open -a flipper.app`
      // Where 19000 is the port where the Expo project is being hosted.
      __flipperHack: 'React Native packager is running',
    };
  }

  /** Resolve all assets and set them on the manifest as URLs */
  private async mutateManifestWithAssetsAsync(manifest: ExpoConfig, bundleUrl: string) {
    await resolveManifestAssets(this.projectRoot, {
      manifest,
      resolver: async (path) => {
        if (this.options.isNativeWebpack) {
          // When using our custom dev server, just do assets normally
          // without the `assets/` subpath redirect.
          return resolve(bundleUrl!.match(/^https?:\/\/.*?\//)![0], path);
        }
        return bundleUrl!.match(/^https?:\/\/.*?\//)![0] + 'assets/' + path;
      },
    });
    // The server normally inserts this but if we're offline we'll do it here
    await resolveGoogleServicesFile(this.projectRoot, manifest);
  }

  /** Create a server middleware handler. */
  public getHandler(): (
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ) => Promise<void> {
    return async (req: ServerRequest, res: ServerResponse, next: ServerNext) => {
      if (this.shouldContinue(req)) {
        return next();
      }

      await this.saveDevicesAsync(req);

      try {
        const { body, version, headers } = await this.getManifestResponseAsync(req);
        for (const [headerName, headerValue] of headers) {
          res.setHeader(headerName, headerValue);
        }
        res.end(body);

        // Log analytics
        this.trackManifest(version ?? null);
      } catch (e) {
        Log.error(e.stack);
        // 5xx = Server Error HTTP code
        res.statusCode = 520;
        res.end(
          JSON.stringify({
            error: e.toString(),
          })
        );
      }
    };
  }
}
