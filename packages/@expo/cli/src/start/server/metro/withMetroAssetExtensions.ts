import { ConfigT } from 'metro-config';
import path from 'path';

import { everyMatchAsync } from '../../../utils/glob';

export async function withMetroAssetExtensionsAsync(config: ConfigT) {
  const { publicPath } = config.transformer;
  const { sourceExts } = config.resolver;

  if (!publicPath) {
    return config;
  }

  const assetRoot = path.join(config.projectRoot, publicPath);
  const assetPattern = `**/*!(.${sourceExts.join('|.')})`;
  const assetFiles = await everyMatchAsync(assetPattern, { cwd: assetRoot });

  const resolvedAssetExts = new Set([
    ...config.resolver.assetExts,
    ...assetFiles.map((file) => path.extname(file).slice(1)),
  ]);

  // TODO(cedric): notify users of missing asset extensions?
  if (resolvedAssetExts.size > config.resolver.assetExts.length) {
    // @ts-expect-error: `readonly` for some reason.
    config.resolver.assetExts = [...resolvedAssetExts];
  }

  return config;
}
