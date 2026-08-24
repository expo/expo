import { isValidAndroidAssetName, WarningAggregator } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

export const IMAGE_TYPES = ['.png', '.jpg', '.gif'];
export const FONT_TYPES = ['.otf', '.ttf'];
export const MEDIA_TYPES = ['.mp4', '.mp3', '.lottie', '.riv'];

export async function resolveAssetPaths(assets: string[], projectRoot: string) {
  const promises = assets.map(async (p) => {
    const resolvedPath = path.resolve(projectRoot, p);
    const stat = await fs.stat(resolvedPath);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      // Only the files in the directory are assets. Nested directories cannot be copied, and
      // hidden files (`.DS_Store` and friends) are not something the user meant to link.
      return entries
        .filter((entry) => !entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => path.join(resolvedPath, entry.name));
    }
    return [resolvedPath];
  });
  return (await Promise.all(promises)).flat();
}

export function validateAssets(assets: string[], platform: 'android' | 'ios') {
  return assets.filter((asset) => {
    const ext = path.extname(asset);
    const name = path.basename(asset, ext);
    const isNameValid = platform === 'android' ? isValidAndroidAssetName(name) : true;
    const isFont = FONT_TYPES.includes(ext);

    if (!isNameValid) {
      WarningAggregator.addWarningForPlatform(
        platform,
        'expo-asset',
        `\`${name}\` is not a supported asset name - file-based resource names must contain only lowercase a-z, 0-9, or underscore`
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
