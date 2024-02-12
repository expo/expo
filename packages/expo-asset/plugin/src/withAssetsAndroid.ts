import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { fontTypes, imageTypes, mediaTypes, resolveAssetPaths, validateAssets } from './utils';

export const withAssetsAndroid: ConfigPlugin<string[]> = (config, assets) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resolvedAssets = await resolveAssetPaths(assets, config.modRequest.projectRoot);
      const validAssets = validateAssets(resolvedAssets);
      await Promise.all(
        validAssets.map(async (asset) => {
          const assetsDir = getAssetDir(asset, config.modRequest.platformProjectRoot);
          await fs.mkdir(assetsDir, { recursive: true });
          const output = path.join(assetsDir, path.basename(asset));
          await fs.copyFile(asset, output);
        })
      );
      return config;
    },
  ]);
};

function getAssetDir(asset: string, root: string) {
  const assetPath = ['app', 'src', 'main', 'assets'];
  const resPath = ['app', 'src', 'main', 'res'];
  const ext = path.extname(asset);

  if (imageTypes.includes(ext)) {
    return path.join(root, ...resPath, 'drawable');
  } else if (fontTypes.includes(ext)) {
    return path.join(root, ...assetPath, 'fonts');
  } else if (mediaTypes.includes(ext)) {
    return path.join(root, ...resPath, 'raw');
  } else {
    return path.join(root, ...assetPath);
  }
}
