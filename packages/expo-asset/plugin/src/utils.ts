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

export function validateAssets(assets: string[]) {
  return assets.filter((asset) => {
    const ext = path.extname(asset);
    const accepted = ACCEPTED_TYPES.includes(ext);
    const isFont = FONT_TYPES.includes(ext);

    if (!accepted) {
      console.warn(`\`${ext}\` is not a supported asset type`);
      return;
    }

    if (isFont) {
      console.warn(
        `Fonts are not supported with the \`expo-asset\` plugin. Please use \`expo-font\` for this functionality. Ignoring ${asset}`
      );
      return;
    }
    return asset;
  });
}
