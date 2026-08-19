import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import {
  injectAssetsIntoHtml,
  type StaticContentAssets,
} from '@expo/router-server/build/utils/html';
import type { RouteNode } from 'expo-router/build/Route';

import { event } from './ssrEvents';

export function serializeHtmlWithAssets({
  resources,
  template,
  devBundleUrl,
  baseUrl,
  route,
  isExporting,
  hydrate,
}: {
  resources: SerialAsset[];
  template: string;
  /** asset prefix used for deploying to non-standard origins like GitHub pages. */
  baseUrl: string;
  devBundleUrl?: string;
  route?: RouteNode;
  isExporting: boolean;
  hydrate?: boolean;
}): string {
  if (!resources) {
    return '';
  }
  const assets = serialAssetsToStaticContentAssets(resources, {
    isExporting,
    baseUrl,
    bundleUrl: isExporting ? undefined : devBundleUrl,
    route,
  });
  return injectAssetsIntoHtml(template, { assets, hydrate });
}

/**
 * Combine the path segments of a URL.
 * This filters out empty segments and avoids duplicate slashes when joining.
 * If base url is empty, it will be treated as a root path, adding `/` to the beginning.
 */
function combineUrlPath(baseUrl: string, ...segments: string[]) {
  return [baseUrl || '/', ...segments]
    .filter(Boolean)
    .map((segment, index) => {
      const segmentIsBaseUrl = index === 0;
      // Do not remove leading slashes from baseUrl
      return segment.replace(segmentIsBaseUrl ? /\/+$/g : /^\/+|\/+$/g, '');
    })
    .join('/');
}

export function serialAssetsToStaticContentAssets(
  assets: SerialAsset[],
  {
    isExporting,
    baseUrl,
    bundleUrl,
    route,
    favicon,
  }: {
    isExporting: boolean;
    baseUrl: string;
    bundleUrl?: string;
    route?: RouteNode;
    favicon?: string;
  }
): StaticContentAssets {
  const css = assets
    .filter((asset) => asset.type === 'css' || asset.type === 'css-external')
    .map((asset) => {
      // NOTE(@hassankhan): External CSS assets are always injected into the HTML as `<link>`s,
      // both in development and in production
      if (asset.type === 'css-external') {
        return { type: 'external' as const, source: asset.source };
      }
      // NOTE(@hassankhan): `isExporting` means export-time rendering (SSG/SPA/DOM components),
      // where CSS is linked from standalone files. In development, we inline CSS into the HTML
      // document directly for HMR
      if (isExporting) {
        return { type: 'css' as const, href: combineUrlPath(baseUrl, asset.filename) };
      }
      return { type: 'inline' as const, source: asset.source, hmrId: asset.metadata.hmrId };
    });

  if (bundleUrl) {
    return { css, js: [bundleUrl], favicon };
  }

  let orderedJsAssets = assetsRequiresSort(assets.filter((asset) => asset.type === 'js'));

  if (route?.entryPoints && Array.isArray(route.entryPoints)) {
    const syncAssets = orderedJsAssets.filter((a) => !a.metadata.isAsync);
    const sortedAsync = sortMatchedAssetsByEntryPoints(
      orderedJsAssets.filter((a) => a.metadata.isAsync),
      route.entryPoints
    );
    const runtimeAssets = syncAssets.filter((a) => !a.metadata.requires?.length);
    const entryAssets = syncAssets.filter((a) => !!a.metadata.requires?.length);
    orderedJsAssets = [...runtimeAssets, ...sortedAsync, ...entryAssets];
  }

  const js = orderedJsAssets
    .filter((asset) => {
      // Sync assets are always linked in the HTML
      if (!asset.metadata.isAsync) {
        return true;
      }
      // Link async chunks that contain one of the route's entry points in the HTML, so the
      // route's own code doesn't wait on a dynamic `import()` waterfall; all other async chunks
      // are left for the runtime to fetch on-demand.
      // TODO: Mark dependencies of the HTML and include them to prevent waterfalls.
      // TODO: Handle module IDs like `expo-router/build/views/Unmatched.js`
      if (
        route?.entryPoints &&
        Array.isArray(route.entryPoints) &&
        Array.isArray(asset.metadata.modulePaths)
      ) {
        const matches = route.entryPoints.some((entryPoint) =>
          (asset.metadata.modulePaths as string[]).includes(entryPoint)
        );
        if (matches) {
          event('html_async_chunk_linked', {
            filename: asset.filename,
            contextKey: route.contextKey,
          });
        }
        return matches;
      }
      return false;
    })
    .map((asset) => combineUrlPath(baseUrl, asset.filename));

  return { css, js, favicon };
}

/**
 * Sorts matched async assets by their matching `entryPoint` in the route's `entryPoints` array.
 * This ensures layout chunks come before page chunks.
 */
export function sortMatchedAssetsByEntryPoints(
  matchedAssets: SerialAsset[],
  entryPoints: string[]
): SerialAsset[] {
  const getEntryPointIndex = (modulePaths?: string[]) =>
    modulePaths ? entryPoints.findIndex((ep) => modulePaths.includes(ep)) : -1;

  return matchedAssets.sort(
    (a, b) =>
      getEntryPointIndex(a.metadata.modulePaths) - getEntryPointIndex(b.metadata.modulePaths)
  );
}

/**
 * Sorts assets based on the requires tree. DFS order.
 */
export function assetsRequiresSort(assets: SerialAsset[]): SerialAsset[] {
  const lookup = new Map<string, SerialAsset>();
  const visited = new Set();
  const visiting = new Set();
  const result: SerialAsset[] = [];

  assets.forEach((a) => {
    lookup.set(a.filename, a);
  });

  function visit(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name))
      throw new Error(
        `Circular dependencies in assets are not allowed. Found cycle: ${[...visiting, name].join(' -> ')}`
      );

    visiting.add(name);

    const module = lookup.get(name);
    if (!module) throw new Error(`Asset not found: ${name}`);

    module.metadata.requires?.forEach((dependency) => {
      visit(dependency);
    });

    visiting.delete(name);
    visited.add(name);
    result.push(module);
  }

  assets.forEach((a) => {
    if (!visited.has(a.filename)) {
      visit(a.filename);
    }
  });

  return result;
}
