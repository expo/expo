import { WarningAggregator } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

export const IMAGE_TYPES = ['.png', '.jpg', '.gif'];
export const FONT_TYPES = ['.otf', '.ttf'];
export const MEDIA_TYPES = ['.mp4', '.mp3', '.lottie', '.riv'];
export const ACCEPTED_TYPES = ['.json', '.db', ...IMAGE_TYPES, ...MEDIA_TYPES, ...FONT_TYPES];

export async function resolveAssetPaths(assets: string[], projectRoot: string) {
  const promises = assets.map(async (p) => {
    const resolvedPath = path.resolve(projectRoot, p);
    const stat = await fs.stat(resolvedPath);
    if (stat.isDirectory()) {
      const dir = await fs.readdir(resolvedPath);
      return dir.map((file) => path.join(resolvedPath, file));
    }
    return [resolvedPath];
  });
  return (await Promise.all(promises)).flat();
}

const validPattern = /^[a-z0-9_]+$/;
function isAndroidAssetNameValid(assetName: string) {
  return validPattern.test(assetName);
}

export function validateAssets(assets: string[], platform: 'android' | 'ios') {
  return assets.filter((asset) => {
    const ext = path.extname(asset);
    const name = path.basename(asset, ext);
    const isNameValid = platform === 'android' ? isAndroidAssetNameValid(name) : true;
    const accepted = ACCEPTED_TYPES.includes(ext);
    const isFont = FONT_TYPES.includes(ext);

    if (!isNameValid) {
      WarningAggregator.addWarningForPlatform(
        platform,
        'expo-asset',
        `\`${name}\` is not a supported asset name - file-based resource names must contain only lowercase a-z, 0-9, or underscore`
      );
      return;
    }

    if (!accepted) {
      WarningAggregator.addWarningForPlatform(
        platform,
        'expo-asset',
        `\`${ext}\` is not a supported asset type`
      );
      return;
    }

    if (isFont) {
      WarningAggregator.addWarningForPlatform(
        platform,
        'expo-asset',
        `Fonts are not supported with the \`expo-asset\` plugin. Use \`expo-font\` instead. Ignoring ${asset}`
      );
      return;
    }
    return asset;
  });
}
