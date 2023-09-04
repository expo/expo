/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getExpoRouteManifestBuilderAsync } from '../getStaticRenderFunctions';
import { getRoutePaths } from './router';

export type ExpoRouterServerManifestV1Route<TRegex = string> = {
  page: string;
  routeKeys: Record<string, string>;
  namedRegex: TRegex;
  generated?: boolean;
};

export type ExpoRouterServerManifestV1<TRegex = string> = {
  dynamicRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
  staticRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
  notFoundRoutes: ExpoRouterServerManifestV1Route<TRegex>[];
};

// TODO: Simplify this now that we use Node.js directly, no need for the Metro bundler caching layer.
export async function fetchManifest<TRegex = string>(
  projectRoot: string,
  options: { asJson?: boolean; appDir: string }
): Promise<ExpoRouterServerManifestV1<TRegex> | null> {
  const getManifest = getExpoRouteManifestBuilderAsync(projectRoot);
  const paths = getRoutePaths(options.appDir);
  // Get the serialized manifest
  const jsonManifest = getManifest(paths);

  if (!jsonManifest) {
    return null;
  }

  if (!jsonManifest.staticRoutes || !jsonManifest.dynamicRoutes) {
    throw new Error('Routes manifest is malformed: ' + JSON.stringify(jsonManifest, null, 2));
  }

  if (!options.asJson) {
    return inflateManifest(jsonManifest);
  }
  return jsonManifest;
}

// Convert the serialized manifest to a usable format
export function inflateManifest(
  json: ExpoRouterServerManifestV1<string>
): ExpoRouterServerManifestV1<RegExp> {
  return {
    ...json,
    staticRoutes: json.staticRoutes?.map((value) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
    dynamicRoutes: json.dynamicRoutes?.map((value) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
    notFoundRoutes: json.notFoundRoutes?.map((value) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
  };
}
