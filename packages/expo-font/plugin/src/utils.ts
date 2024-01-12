import fs from 'fs/promises';
import path from 'path';

export async function resolveFontPaths(fonts: string[], projectRoot: string) {
  const promises = fonts.map(async (p) => {
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
