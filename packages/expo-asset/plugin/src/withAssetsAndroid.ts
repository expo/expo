import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

import { FONT_TYPES, IMAGE_TYPES, MEDIA_TYPES, resolveAssetPaths, validateAssets } from './utils';

export const withAssetsAndroid: ConfigPlugin<string[]> = (config, assets) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resolvedAssets = await resolveAssetPaths(assets, config.modRequest.projectRoot);
      const validAssets = validateAssets(resolvedAssets);

      validAssets.forEach((asset) => {
        const assetsDir = getAssetDir(asset, config.modRequest.platformProjectRoot);
        fs.mkdirSync(assetsDir, { recursive: true });
      });

      await Promise.all(
        validAssets.map(async (asset) => {
          const assetsDir = getAssetDir(asset, config.modRequest.platformProjectRoot);
          const output = path.join(assetsDir, path.basename(asset));
          await fsp.copyFile(asset, output);
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

  if (IMAGE_TYPES.includes(ext)) {
    return path.join(root, ...resPath, 'drawable');
  } else if (FONT_TYPES.includes(ext)) {
    return path.join(root, ...assetPath, 'fonts');
  } else if (MEDIA_TYPES.includes(ext)) {
    return path.join(root, ...resPath, 'raw');
  } else {
    return path.join(root, ...assetPath);
  }
}
