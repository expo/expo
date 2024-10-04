import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';
import { RouteNode } from 'expo-router/build/Route';

const debug = require('debug')('expo:metro:html') as typeof console.log;

export function serializeHtmlWithAssets({
  mode,
  resources,
  template,
  devBundleUrl,
  baseUrl,
  route,
}: {
  mode: 'development' | 'production';
  resources: SerialAsset[];
  template: string;
  /** asset prefix used for deploying to non-standard origins like GitHub pages. */
  baseUrl: string;
  devBundleUrl?: string;
  route?: RouteNode;
}): string {
  if (!resources) {
    return '';
  }
  const isDev = mode === 'development';
  return htmlFromSerialAssets(resources, {
    dev: isDev,
    template,
    baseUrl,
    bundleUrl: isDev ? devBundleUrl : undefined,
    route,
  });
}

function htmlFromSerialAssets(
  assets: SerialAsset[],
  {
    dev,
    template,
    baseUrl,
    bundleUrl,
    route,
  }: {
    dev: boolean;
    template: string;
    baseUrl: string;
    /** This is dev-only. */
    bundleUrl?: string;
    route?: RouteNode;
  }
) {
  // Combine the CSS modules into tags that have hot refresh data attributes.
  const styleString = assets
    .filter((asset) => asset.type === 'css')
    .map(({ metadata, filename, source }) => {
      if (dev) {
        return `<style data-expo-css-hmr="${metadata.hmrId}">` + source + '\n</style>';
      } else {
        return [
          `<link rel="preload" href="${baseUrl}/${filename}" as="style">`,
          `<link rel="stylesheet" href="${baseUrl}/${filename}">`,
        ].join('');
      }
    })
    .join('');

  const jsAssets = assets.filter((asset) => asset.type === 'js');

  const scripts = bundleUrl
    ? `<script src="${bundleUrl}" defer></script>`
    : jsAssets
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
          }

          return `<script src="${baseUrl}/${filename}" defer></script>`;
        })
        .join('');

  return template
    .replace('</head>', `${styleString}</head>`)
    .replace('</body>', `${scripts}\n</body>`);
}
