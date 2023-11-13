import { SerialAsset } from '@expo/metro-config/build/serializer/serializerAssets';

export function serializeHtmlWithAssets({
  mode,
  resources,
  template,
  devBundleUrl,
  baseUrl,
}: {
  mode: 'development' | 'production';
  resources: SerialAsset[];
  template: string;
  /** asset prefix used for deploying to non-standard origins like GitHub pages. */
  baseUrl: string;
  devBundleUrl?: string;
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
  });
}

function htmlFromSerialAssets(
  assets: SerialAsset[],
  {
    dev,
    template,
    baseUrl,
    bundleUrl,
  }: {
    dev: boolean;
    template: string;
    baseUrl: string;
    /** This is dev-only. */
    bundleUrl?: string;
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
        .map(({ filename }) => {
          return `<script src="${baseUrl}/${filename}" defer></script>`;
        })
        .join('');

  return template
    .replace('</head>', `${styleString}</head>`)
    .replace('</body>', `${scripts}\n</body>`);
}
