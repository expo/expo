import type { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import {
  createInjectedCssElements,
  createInjectedScriptElements,
  getHydrationFlagScript,
} from '@expo/router-server/build/utils/html';
import type { RouteNode } from 'expo-router/build/Route';

const debug = require('debug')('expo:metro:html') as typeof console.log;

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
  return htmlFromSerialAssets(resources, {
    isExporting,
    template,
    baseUrl,
    bundleUrl: isExporting ? undefined : devBundleUrl,
    route,
    hydrate,
  });
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

function htmlFromSerialAssets(
  assets: SerialAsset[],
  {
    isExporting,
    template,
    baseUrl,
    bundleUrl,
    route,
    hydrate,
  }: {
    isExporting: boolean;
    template: string;
    baseUrl: string;
    /** This is dev-only. */
    bundleUrl?: string;
    route?: RouteNode;
    hydrate?: boolean;
  }
) {
  // Combine the CSS modules into tags that have hot refresh data attributes.
  const styleString = assets
    .filter((asset) => asset.type.startsWith('css'))
    .map(({ type, metadata, filename, source }) => {
      if (type === 'css') {
        if (isExporting) {
          return createInjectedCssElements([combineUrlPath(baseUrl, filename)]);
        } else {
          return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
        }
      }
      // External link tags will be passed through as-is.
      return source;
    })
    .join('');

  let orderedJsAssets = assetsRequiresSort(assets.filter((asset) => asset.type === 'js'));

  if (route?.entryPoints && Array.isArray(route.entryPoints)) {
    const syncAssets = orderedJsAssets.filter((a) => !a.metadata.isAsync);
    const sortedAsync = sortMatchedAssetsByEntryPoints(
      orderedJsAssets.filter((a) => a.metadata.isAsync),
      route.entryPoints
    );
    orderedJsAssets = [...syncAssets, ...sortedAsync];
  }

  const scripts = bundleUrl
    ? `<script src="${bundleUrl}" defer></script>`
    : orderedJsAssets
        .map(({ filename, metadata }) => {
          // TODO: Mark dependencies of the HTML and include them to prevent waterfalls.
          if (metadata.isAsync) {
            // We have the data required to match async chunks to the route's HTML file.
            if (
              route?.entryPoints &&
              metadata.modulePaths &&
              Array.isArray(route.entryPoints) &&
              Array.isArray(metadata.modulePaths)
            ) {
              // TODO: Handle module IDs like `expo-router/build/views/Unmatched.js`
              const doesAsyncChunkContainRouteEntryPoint = route.entryPoints.some((entryPoint) =>
                (metadata.modulePaths as string[]).includes(entryPoint)
              );
              if (!doesAsyncChunkContainRouteEntryPoint) {
                return '';
              }
              debug('Linking async chunk %s to HTML for route %s', filename, route.contextKey);
              // Pass through to the next condition.
            } else {
              return '';
            }
            // Mark async chunks as defer so they don't block the page load.
            // return `<script src="${combineUrlPath(baseUrl, filename)" defer></script>`;
          }

          return createInjectedScriptElements([combineUrlPath(baseUrl, filename)]);
        })
        .join('');

  if (hydrate) {
    template = template.replace('</head>', `${getHydrationFlagScript()}</head>`);
  }

  return template
    .replace('</head>', `${styleString}</head>`)
    .replace('</body>', `${scripts}\n</body>`);
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
