import fs from 'fs';
import path from 'path';

// TODO(@HubertBer): Also exists in expo-modules-autolinking, but with a limiter, maybe take it or depend on it?
export const taskAll = <T, R>(
  inputs: T[],
  map: (input: T, index: number) => Promise<R>
): Promise<R[]> => {
  return Promise.all(inputs.map(map));
};

// TODO(@HubertBer): Taken from expo-modules-autolinking, maybe import it instead?
export async function* scanFilesRecursively(
  parentPath: string,
  includeDirectory?: (parentPath: string, name: string) => boolean,
  sort = !fs.promises.opendir
) {
  const queue = [parentPath];
  let targetPath: string | undefined;
  while (queue.length > 0 && (targetPath = queue.shift()) != null) {
    try {
      const entries = sort
        ? (await fs.promises.readdir(targetPath, { withFileTypes: true })).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        : await fs.promises.opendir(targetPath);
      for await (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          if (!includeDirectory || includeDirectory(targetPath, entry.name)) {
            queue.push(path.join(targetPath, entry.name));
          }
        } else if (entry.isFile()) {
          yield {
            path: path.join(targetPath, entry.name),
            parentPath: targetPath,
            name: entry.name,
          } as const;
        }
      }
    } catch {
      continue;
    }
  }
}
