import path from 'node:path';

// NOTE(@kitten): This is a heuristic and shouldn't trigger. However, if we erroneously start the watch folders
// traversal, we never want to create a situation where (for whatever reason) it gets stuck,
// or slows the startup down by an unreasonable amount
const MAX_DEPTH = 6;

export function resolveWatchFolders(pkgName: string, { deep }: { deep: boolean }): string[] {
  const seen = new Set<string>();
  const folders = new Set<string>();
  const recurse = (pkgName: string, fromPath: string | undefined = undefined, depth = 0) => {
    if (seen.has(pkgName) || depth > MAX_DEPTH) {
      return;
    } else {
      seen.add(pkgName);
    }
    let target: string;
    try {
      target = require.resolve(`${pkgName}/package.json`, {
        paths: fromPath ? [fromPath] : undefined,
      });
    } catch {
      return;
    }
    let folder = path.dirname(path.dirname(target));
    if (pkgName[0] === '@') {
      folder = path.dirname(folder);
    }
    folders.add(folder);
    if (deep) {
      const pkg = require(target);
      if (pkg.dependencies != null && typeof pkg.dependencies === 'object') {
        for (const pkgName in pkg.dependencies) recurse(pkgName, target, depth + 1);
      }
      if (pkg.peerDependencies != null && typeof pkg.peerDependencies === 'object') {
        for (const pkgName in pkg.peerDependencies) recurse(pkgName, target, depth + 1);
      }
    }
  };
  recurse(pkgName);
  return [...folders];
}
