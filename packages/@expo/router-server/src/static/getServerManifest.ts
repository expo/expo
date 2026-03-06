/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ctx } from 'expo-router/_ctx';
import {
  getReactNavigationConfig,
  getRoutes,
  type GetRoutesOptions,
} from 'expo-router/internal/routing';
import { type RoutesManifest } from 'expo-server/private';

import { getServerManifest } from '../getServerManifest';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';

/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `@expo/router-server/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
export async function getBuildTimeServerManifestAsync(
  options: GetRoutesOptions = {}
): Promise<RoutesManifest<string>> {
  const routeTree = getRoutes(ctx, {
    platform: 'web',
    ...options,
  });

  // Evaluate all static params; skip for SSR mode where routes are matched at runtime
  if (routeTree && !options.skipStaticParams) {
    await loadStaticParamsAsync(routeTree);
  }

  // NOTE(@kitten): The route tree can be `null` and should be accepted if the app
  // has no route tree set up. This can happen when we build against a project that
  // isn't an expo-router project or not fully set up yet, but has expo-router options
  // in the app.json already
  return getServerManifest(routeTree, options);
}

/** Get the linking manifest from a Node.js process. */
export async function getManifest(options: GetRoutesOptions = {}) {
  const routeTree = getRoutes(ctx, {
    preserveApiRoutes: true,
    preserveRedirectAndRewrites: true,
    platform: 'web',
    ...options,
  });

  if (routeTree) {
    // Evaluate all static params
    await loadStaticParamsAsync(routeTree);
  }

  // NOTE(@kitten): The route tree can be `null` and should be accepted if the app
  // has no route tree set up. This can happen when we build against a project that
  // isn't an expo-router project or not fully set up yet, but has expo-router options
  // in the app.json already
  return getReactNavigationConfig(routeTree, false);
}
