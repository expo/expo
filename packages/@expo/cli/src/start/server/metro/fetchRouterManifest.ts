/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Options as RoutesManifestOptions } from '@expo/router-server/build/routes-manifest';
import { type MiddlewareInfo, type RouteInfo, type RoutesManifest } from 'expo-server/private';
import resolveFrom from 'resolve-from';

import { getRoutePaths } from './router';

function getExpoRouteManifestBuilderAsync(projectRoot: string) {
  return require(resolveFrom(projectRoot, '@expo/router-server/build/routes-manifest'))
    .createRoutesManifest as typeof import('@expo/router-server/build/routes-manifest').createRoutesManifest;
}

interface FetchManifestOptions extends RoutesManifestOptions {
  asJson?: boolean;
  appDir: string;
}

// TODO: Simplify this now that we use Node.js directly, no need for the Metro bundler caching layer.
async function fetchManifest(
  projectRoot: string,
  options: FetchManifestOptions & { asJson: true }
): Promise<RoutesManifest<string> | null>;
async function fetchManifest(
  projectRoot: string,
  options: FetchManifestOptions & { asJson?: false | undefined }
): Promise<RoutesManifest<RegExp> | null>;
async function fetchManifest(
  projectRoot: string,
  options: FetchManifestOptions
): Promise<RoutesManifest | null> {
  const getManifest = getExpoRouteManifestBuilderAsync(projectRoot);
  const paths = getRoutePaths(options.appDir);
  // Get the serialized manifest
  const jsonManifest = getManifest(paths, options);
  if (!jsonManifest) {
    return null;
  }

  if (!jsonManifest.htmlRoutes || !jsonManifest.apiRoutes) {
    throw new Error('Routes manifest is malformed: ' + JSON.stringify(jsonManifest, null, 2));
  }

  if (!options.asJson) {
    return inflateManifest(jsonManifest);
  } else {
    return jsonManifest;
  }
}

export { fetchManifest };

// Convert the serialized manifest to a usable format
export function inflateManifest(json: RoutesManifest<string>): RoutesManifest<RegExp> {
  return {
    ...json,
    middleware: json.middleware,
    htmlRoutes: json.htmlRoutes?.map((value) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
    apiRoutes: json.apiRoutes?.map((value) => {
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
    redirects: json.redirects?.map((value: any) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
    rewrites: json.rewrites?.map((value: any) => {
      return {
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      };
    }),
  };
}
