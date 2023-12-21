import fs from 'fs/promises';
import path from 'path';

export function toAndroidResourceString(string: string) {
  return string.replace(/(-| )/, '_').toLowerCase();
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

type GroupedObject<T> = { [key: string]: T[] };

export function groupBy<T>(array: T[], key: keyof T): GroupedObject<T> {
  return array.reduce((result: GroupedObject<T>, item: T) => {
    const keyValue = item[key] as string;
    result[keyValue] = result[keyValue] || [];
    result[keyValue].push(item);
    return result;
  }, {});
}
