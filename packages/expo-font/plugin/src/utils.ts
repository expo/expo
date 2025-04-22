import fs from 'fs/promises';
import path from 'path';

// rule: File-based resource names must contain only lowercase a-z, 0-9, or underscore
export function toValidAndroidResourceName(value: string) {
  const valueWithoutFileExtension = path.parse(value).name;

  const withUnderscores = valueWithoutFileExtension
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');

  return withUnderscores
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
}

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
  return (await Promise.all(promises))
    .flat()
    .filter(
      (p) => p.endsWith('.ttf') || p.endsWith('.otf') || p.endsWith('.woff') || p.endsWith('.woff2')
    );
}
