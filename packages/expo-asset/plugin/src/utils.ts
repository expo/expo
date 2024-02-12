import fs from 'fs/promises';
import path from 'path';

export const imageTypes = ['.png', '.jpg', '.gif'];
export const fontTypes = ['.otf', '.ttf'];
export const mediaTypes = ['.mp4', '.mp3'];
export const ACCEPTED_TYPES = ['.json', '.db', ...imageTypes, ...mediaTypes, ...fontTypes];

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
  return assets?.filter((asset) => {
    const ext = path.extname(asset);
    const accepted = ACCEPTED_TYPES.includes(ext);

    if (!accepted) {
      console.warn(`\`${ext}\` is not a supported asset type`);
      return;
    }
    return asset;
  });
}
