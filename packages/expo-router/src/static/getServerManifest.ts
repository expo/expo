/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ctx } from '../../_ctx';
import { getRoutes, Options } from '../getRoutes';
import { ExpoRouterServerManifestV1, getServerManifest } from '../getServerManifest';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';

/**
 * Get the server manifest with all dynamic routes loaded with `generateStaticParams`.
 * Unlike the `expo-router/src/routes-manifest.ts` method, this requires loading the entire app in-memory, which
 * takes substantially longer and requires Metro bundling.
 *
 * This is used for the production manifest where we pre-render certain pages and should no longer treat them as dynamic.
 */
export async function getBuildTimeServerManifestAsync(
  options: Options = {}
): Promise<ExpoRouterServerManifestV1> {
  const routeTree = getRoutes(ctx, {
    platform: 'web',
    ...options,
  });

  if (!routeTree) {
    throw new Error('No routes found');
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getServerManifest(routeTree);
}
