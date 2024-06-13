import {
  ExpoConfig,
  ExpoGoConfig,
  getConfig,
  PackageJSONConfig,
  ProjectConfig,
} from '@expo/config';
import { resolveEntryPoint } from '@expo/config/paths';
import findWorkspaceRoot from 'find-yarn-workspace-root';
import path from 'path';
import { resolve } from 'url';

import { ExpoMiddleware } from './ExpoMiddleware';
import {
  shouldEnableAsyncImports,
  createBundleUrlPath,
  getBaseUrlFromExpoConfig,
  getAsyncRoutesFromExpoConfig,
  createBundleUrlPathFromExpoConfig,
} from './metroOptions';
import { resolveGoogleServicesFile, resolveManifestAssets } from './resolveAssets';
import { parsePlatformHeader, RuntimePlatform } from './resolvePlatform';
import { ServerHeaders, ServerNext, ServerRequest, ServerResponse } from './server.types';
import { isEnableHermesManaged } from '../../../export/exportHermes';
import * as Log from '../../../log';
import { env } from '../../../utils/env';
import { CommandError } from '../../../utils/errors';
import { stripExtension } from '../../../utils/url';
import * as ProjectDevices from '../../project/devices';
import { UrlCreator } from '../UrlCreator';
import { getRouterDirectoryModuleIdWithManifest } from '../metro/router';
import { getPlatformBundlers, PlatformBundlers } from '../platformBundlers';
import { createTemplateHtmlFromExpoConfigAsync } from '../webTemplate';

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

const supportedPlatforms = ['ios', 'android', 'web', 'none'];

export function getEntryWithServerRoot(
  projectRoot: string,
  props: { platform: string; pkg?: PackageJSONConfig }
) {
  if (!supportedPlatforms.includes(props.platform)) {
    throw new CommandError(
      `Failed to resolve the project's entry file: The platform "${props.platform}" is not supported.`
    );
  }
  return path.relative(getMetroServerRoot(projectRoot), resolveEntryPoint(projectRoot, props));
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
  props: { platform: string; pkg?: PackageJSONConfig }
): string {
  const entryPoint = getEntryWithServerRoot(projectRoot, props);

  debug(`Resolved entry point: ${entryPoint} (project root: ${projectRoot})`);

  return stripExtension(entryPoint, 'js');
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
  /** The protocol used to request the manifest */
  protocol?: 'http' | 'https';
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
  TManifestRequestInfo extends ManifestRequestInfo,
> extends ExpoMiddleware {
  private initialProjectConfig: ProjectConfig;
  private platformBundlers: PlatformBundlers;

  constructor(
    protected projectRoot: string,
    protected options: ManifestMiddlewareOptions
  ) {
    super(
      projectRoot,
      /**
       * Only support `/`, `/manifest`, `/index.exp` for the manifest middleware.
       */
      ['/', '/manifest', '/index.exp']
    );
    this.initialProjectConfig = getConfig(projectRoot);
    this.platformBundlers = getPlatformBundlers(projectRoot, this.initialProjectConfig.exp);
  }

  /** Exposed for testing. */
  public async _resolveProjectSettingsAsync({
    platform,
    hostname,
    protocol,
  }: Pick<
    TManifestRequestInfo,
    'hostname' | 'platform' | 'protocol'
  >): Promise<ResponseProjectSettings> {
    // Read the config
    const projectConfig = getConfig(this.projectRoot);

    // Read from headers
    const mainModuleName = this.resolveMainModuleName({
      pkg: projectConfig.pkg,
      platform,
    });

    const isHermesEnabled = isEnableHermesManaged(projectConfig.exp, platform);

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
      engine: isHermesEnabled ? 'hermes' : undefined,
      baseUrl: getBaseUrlFromExpoConfig(projectConfig.exp),
      asyncRoutes: getAsyncRoutesFromExpoConfig(
        projectConfig.exp,
        this.options.mode ?? 'development',
        platform
      ),
      routerRoot: getRouterDirectoryModuleIdWithManifest(this.projectRoot, projectConfig.exp),
      protocol,
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
  private resolveMainModuleName(props: { pkg: PackageJSONConfig; platform: string }): string {
    let entryPoint = getEntryWithServerRoot(this.projectRoot, props);

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
    engine,
    baseUrl,
    isExporting,
    asyncRoutes,
    routerRoot,
    protocol,
  }: {
    platform: string;
    hostname?: string | null;
    mainModuleName: string;
    engine?: 'hermes';
    baseUrl?: string;
    asyncRoutes: boolean;
    isExporting?: boolean;
    routerRoot: string;
    protocol?: 'http' | 'https';
  }): string {
    const path = createBundleUrlPath({
      mode: this.options.mode ?? 'development',
      minify: this.options.minify,
      platform,
      mainModuleName,
      lazy: shouldEnableAsyncImports(this.projectRoot),
      engine,
      bytecode: engine === 'hermes',
      baseUrl,
      isExporting: !!isExporting,
      asyncRoutes,
      routerRoot,
    });

    return (
      this.options.constructUrl({
        scheme: protocol ?? 'http',
        // hostType: this.options.location.hostType,
        hostname,
      }) + path
    );
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
      // localhost:8081
      debuggerHost: this.options.constructUrl({ scheme: '', hostname }),
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
      // `METRO_SERVER_PORT=8081 open -a flipper.app`
      // Where 8081 is the port where the Expo project is being hosted.
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
    const mainModuleName = this.resolveMainModuleName({
      pkg: this.initialProjectConfig.pkg,
      platform,
    });

    return createBundleUrlPathFromExpoConfig(this.projectRoot, this.initialProjectConfig.exp, {
      platform,
      mainModuleName,
      minify: this.options.minify,
      lazy: shouldEnableAsyncImports(this.projectRoot),
      mode: this.options.mode ?? 'development',
      // Hermes doesn't support more modern JS features than most, if not all, modern browser.
      engine: 'hermes',
      isExporting: false,
      bytecode: false,
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
    if (
      this.platformBundlers.web === 'metro' &&
      this.initialProjectConfig.exp.platforms?.includes('web')
    ) {
      // NOTE(EvanBacon): This effectively disables the safety check we do on custom runtimes to ensure
      // the `expo-platform` header is included. When `web.bundler=web`, if the user has non-standard Expo
      // code loading then they'll get a web bundle without a clear assertion of platform support.
      const platform = parsePlatformHeader(req);
      // On web, serve the public folder
      if (!platform || platform === 'web') {
        if (['static', 'server'].includes(this.initialProjectConfig.exp.web?.output ?? '')) {
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
