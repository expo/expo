import { ExpoConfig, ExpoGoConfig, getConfig, ProjectConfig } from '@expo/config';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import { resolve } from 'url';

import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { stripExtension } from '../../../utils/url';
import * as ProjectDevices from '../../project/devices';
import { UrlCreator } from '../UrlCreator';
import { getPlatformBundlers } from '../platformBundlers';
import { createTemplateHtmlFromExpoConfigAsync } from '../webTemplate';
import { ExpoMiddleware } from './ExpoMiddleware';
import { resolveGoogleServicesFile, resolveManifestAssets } from './resolveAssets';
import { resolveAbsoluteEntryPoint } from './resolveEntryPoint';
import { parsePlatformHeader, RuntimePlatform } from './resolvePlatform';
import { ServerHeaders, ServerNext, ServerRequest, ServerResponse } from './server.types';

const debug = require('debug')('expo:start:server:middleware:manifest') as typeof console.log;

/** Wraps `findWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
export function getWorkspaceRoot(projectRoot: string): string | null {
  try {
    return findWorkspaceRoot(projectRoot);
  } catch (error: any) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}

export function getEntryWithServerRoot(
  projectRoot: string,
  projectConfig: ProjectConfig,
  platform: string
) {
  return path.relative(
    getMetroServerRoot(projectRoot),
    resolveAbsoluteEntryPoint(projectRoot, platform, projectConfig)
  );
}

export function getMetroServerRoot(projectRoot: string) {
  if (env.EXPO_USE_METRO_WORKSPACE_ROOT) {
    return getWorkspaceRoot(projectRoot) ?? projectRoot;
  }

  return projectRoot;
}

/** Get the main entry module ID (file) relative to the project root. */
export function resolveMainModuleName(
  projectRoot: string,
  projectConfig: ProjectConfig,
  platform: string
): string {
  const entryPoint = getEntryWithServerRoot(projectRoot, projectConfig, platform);

  debug(`Resolved entry point: ${entryPoint} (project root: ${projectRoot})`);

  return stripExtension(entryPoint, 'js');
}

export function createBundleUrlPath({
  platform,
  mainModuleName,
  mode,
  minify = mode === 'production',
  environment,
  serializerOutput,
}: {
  platform: string;
  mainModuleName: string;
  mode: string;
  minify?: boolean;
  environment?: string;
  serializerOutput?: 'static';
}): string {
  const queryParams = new URLSearchParams({
    platform: encodeURIComponent(platform),
    dev: String(mode !== 'production'),
    // TODO: Is this still needed?
    hot: String(false),
    lazy: String(!env.EXPO_NO_METRO_LAZY),
  });

  if (minify) {
    queryParams.append('minify', String(minify));
  }
  if (environment) {
    queryParams.append('resolver.environment', environment);
    queryParams.append('transform.environment', environment);
  }
  if (serializerOutput) {
    queryParams.append('serializer.output', serializerOutput);
  }

  return `/${encodeURI(mainModuleName)}.bundle?${queryParams.toString()}`;
}

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
export interface ManifestRequestInfo {
  /** Platform to serve. */
  platform: RuntimePlatform;
  /** Requested host name. */
  hostname?: string | null;
}

/** Project related info. */
export type ResponseProjectSettings = {
  expoGoConfig: ExpoGoConfig;
  hostUri: string;
  bundleUrl: string;
  exp: ExpoConfig;
};

export const DEVELOPER_TOOL = 'expo-cli';

export type ManifestMiddlewareOptions = {
  /** Should start the dev servers in development mode (minify). */
  mode?: 'development' | 'production';
  /** Should instruct the bundler to create minified bundles. */
  minify?: boolean;
  constructUrl: UrlCreator['constructUrl'];
  isNativeWebpack?: boolean;
  privateKeyPath?: string;
};

/** Base middleware creator for serving the Expo manifest (like the index.html but for native runtimes). */
export abstract class ManifestMiddleware<
  TManifestRequestInfo extends ManifestRequestInfo
> extends ExpoMiddleware {
  private initialProjectConfig: ProjectConfig;

  constructor(protected projectRoot: string, protected options: ManifestMiddlewareOptions) {
    super(
      projectRoot,
      /**
       * Only support `/`, `/manifest`, `/index.exp` for the manifest middleware.
       */
      ['/', '/manifest', '/index.exp']
    );
    this.initialProjectConfig = getConfig(projectRoot);
  }

  /** Exposed for testing. */
  public async _resolveProjectSettingsAsync({
    platform,
    hostname,
  }: Pick<TManifestRequestInfo, 'hostname' | 'platform'>): Promise<ResponseProjectSettings> {
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

    const bundleUrl = this._getBundleUrl({
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

  /** Get the main entry module ID (file) relative to the project root. */
  private resolveMainModuleName(projectConfig: ProjectConfig, platform: string): string {
    let entryPoint = getEntryWithServerRoot(this.projectRoot, projectConfig, platform);

    debug(`Resolved entry point: ${entryPoint} (project root: ${this.projectRoot})`);

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
  public abstract getParsedHeaders(req: ServerRequest): TManifestRequestInfo;

  /** Store device IDs that were sent in the request headers. */
  private async saveDevicesAsync(req: ServerRequest) {
    const deviceIds = req.headers?.['expo-dev-client-id'];
    if (deviceIds) {
      await ProjectDevices.saveDevicesAsync(this.projectRoot, deviceIds).catch((e) =>
        Log.exception(e)
      );
    }
  }

  /** Create the bundle URL (points to the single JS entry file). Exposed for testing. */
  public _getBundleUrl({
    platform,
    mainModuleName,
    hostname,
  }: {
    platform: string;
    hostname?: string | null;
    mainModuleName: string;
  }): string {
    const path = createBundleUrlPath({
      mode: this.options.mode ?? 'development',
      minify: this.options.minify,
      platform,
      mainModuleName,
    });

    return (
      this.options.constructUrl({
        scheme: 'http',
        // hostType: this.options.location.hostType,
        hostname,
      }) + path
    );
  }

  public _getBundleUrlPath({
    platform,
    mainModuleName,
  }: {
    platform: string;
    mainModuleName: string;
  }): string {
    const queryParams = new URLSearchParams({
      platform: encodeURIComponent(platform),
      dev: String(this.options.mode !== 'production'),
      // TODO: Is this still needed?
      hot: String(false),
      lazy: String(!env.EXPO_NO_METRO_LAZY),
    });

    if (this.options.minify) {
      queryParams.append('minify', String(this.options.minify));
    }

    return `/${encodeURI(mainModuleName)}.bundle?${queryParams.toString()}`;
  }

  /** Log telemetry. */
  protected abstract trackManifest(version?: string): void;

  /** Get the manifest response to return to the runtime. This file contains info regarding where the assets can be loaded from. Exposed for testing. */
  public abstract _getManifestResponseAsync(options: TManifestRequestInfo): Promise<{
    body: string;
    version: string;
    headers: ServerHeaders;
  }>;

  private getExpoGoConfig({
    mainModuleName,
    hostname,
  }: {
    mainModuleName: string;
    hostname?: string | null;
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
        dev: this.options.mode !== 'production',
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

  public getWebBundleUrl() {
    const platform = 'web';
    // Read from headers
    const mainModuleName = this.resolveMainModuleName(this.initialProjectConfig, platform);
    return this._getBundleUrlPath({
      platform,
      mainModuleName,
    });
  }

  /**
   * Web platforms should create an index.html response using the same script resolution as native.
   *
   * Instead of adding a `bundleUrl` to a `manifest.json` (native) we'll add a `<script src="">`
   * to an `index.html`, this enables the web platform to load JavaScript from the server.
   */
  private async handleWebRequestAsync(req: ServerRequest, res: ServerResponse) {
    // Read from headers
    const bundleUrl = this.getWebBundleUrl();

    res.setHeader('Content-Type', 'text/html');

    res.end(
      await createTemplateHtmlFromExpoConfigAsync(this.projectRoot, {
        exp: this.initialProjectConfig.exp,
        scripts: [bundleUrl],
      })
    );
  }

  /** Exposed for testing. */
  async checkBrowserRequestAsync(req: ServerRequest, res: ServerResponse, next: ServerNext) {
    // Read the config
    const bundlers = getPlatformBundlers(this.initialProjectConfig.exp);
    if (bundlers.web === 'metro') {
      // NOTE(EvanBacon): This effectively disables the safety check we do on custom runtimes to ensure
      // the `expo-platform` header is included. When `web.bundler=web`, if the user has non-standard Expo
      // code loading then they'll get a web bundle without a clear assertion of platform support.
      const platform = parsePlatformHeader(req);
      // On web, serve the public folder
      if (!platform || platform === 'web') {
        if (this.initialProjectConfig.exp.web?.output === 'static') {
          // Skip the spa-styled index.html when static generation is enabled.
          next();
          return true;
        } else {
          await this.handleWebRequestAsync(req, res);
          return true;
        }
      }
    }
    return false;
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    // First check for standard JavaScript runtimes (aka legacy browsers like Chrome).
    if (await this.checkBrowserRequestAsync(req, res, next)) {
      return;
    }

    // Save device IDs for dev client.
    await this.saveDevicesAsync(req);

    // Read from headers
    const options = this.getParsedHeaders(req);
    const { body, version, headers } = await this._getManifestResponseAsync(options);
    for (const [headerName, headerValue] of headers) {
      res.setHeader(headerName, headerValue);
    }
    res.end(body);

    // Log analytics
    this.trackManifest(version ?? null);
  }
}
