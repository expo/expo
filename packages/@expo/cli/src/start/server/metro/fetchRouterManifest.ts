/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { SilentError } from '../../../utils/errors';
import { getExpoRouteManifestBuilderAsync } from '../getStaticRenderFunctions';
import { getRoutePaths } from './router';

const debug = require('debug')('expo:routes-manifest') as typeof console.log;

export type ExpoRouterServerManifestV1Route<TRegex = string> = {
  page: string;
  routeKeys: Record<string, string>;
  namedRegex: TRegex;
  generated?: boolean;
};

export type ExpoRouterServerManifestV1<TRegex = string> = {
  staticHtmlPaths: string[];
  dynamicRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
  staticRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
  notFoundRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
};

export type LoadManifestResult<TRegex = string> = {
  error?: Error;
  manifest?: ExpoRouterServerManifestV1<TRegex> | null;
};

const manifestOperation = new Map<string, Promise<any>>();

export async function invalidateManifestCache() {
  manifestOperation.delete('manifest');
}

export async function refetchManifest(
  projectRoot: string,
  options: { mode?: string; port?: number; appDir: string }
) {
  invalidateManifestCache();

  return fetchManifest(projectRoot, options);
}

export async function fetchManifest<TRegex = string>(
  projectRoot: string,
  options: { mode?: string; port?: number; asJson?: boolean; appDir: string }
): Promise<LoadManifestResult<TRegex>> {
  if (manifestOperation.has('manifest')) {
    const manifest = await manifestOperation.get('manifest');
    if (!manifest.error) {
      return manifest;
    }
  }

  const devServerUrl = `http://localhost:${options.port}`;

  async function bundleAsync(): Promise<LoadManifestResult<TRegex>> {
    // TODO: Update eagerly when files change
    const getManifest = await getExpoRouteManifestBuilderAsync(projectRoot, {
      devServerUrl,
      minify: options.mode === 'production',
      dev: options.mode !== 'production',
    });

    if (!getManifest) {
      return { manifest: null };
    }

    let results: any;
    // try {
    const paths = getRoutePaths(options.appDir);
    console.log('Paths:', paths);
    // Get the serialized manifest
    results = await getManifest(paths);
    // } catch (error: any) {
    //   console.log('ERR', error);
    //   if (!(error instanceof SilentError)) {
    //     // This can throw if there are any top-level errors in any files when bundling.
    //     debug('Error while bundling manifest:', error);
    //   }
    //   return { error };
    // }

    if (!results) {
      return { manifest: null };
    }

    if (!results.staticRoutes || !results.dynamicRoutes) {
      throw new Error('Routes manifest is malformed: ' + JSON.stringify(results, null, 2));
    }

    if (!options.asJson) {
      results = inflateManifest(results);
    }
    // console.log('manifest', results);
    return { manifest: results };
  }

  const manifest = bundleAsync();
  if (manifest) {
    manifestOperation.set('manifest', manifest);
  }
  return manifest;
}

// Convert the serialized manifest to a usable format
export function inflateManifest(json: any): ExpoRouterServerManifestV1<RegExp> {
  json.staticRoutes = json.staticRoutes?.map((value: any) => {
    return {
      ...value,
      namedRegex: new RegExp(value.namedRegex),
    };
  });
  json.dynamicRoutes = json.dynamicRoutes?.map((value: any) => {
    return {
      ...value,
      namedRegex: new RegExp(value.namedRegex),
    };
  });
  json.notFoundRoutes = json.notFoundRoutes?.map((value: any) => {
    return {
      ...value,
      namedRegex: new RegExp(value.namedRegex),
    };
  });

  return json;
}
