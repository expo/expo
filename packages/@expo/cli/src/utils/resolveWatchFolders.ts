import path from 'node:path';

export function resolveWatchFolders(pkgName: string, { deep }: { deep: boolean }): string[] {
  const seen = new Set<string>();
  const folders = new Set<string>();
  const recurse = (pkgName: string, fromPath: string | undefined) => {
    if (seen.has(pkgName)) {
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
        for (const pkgName in pkg.dependencies) recurse(pkgName, target);
      }
      if (pkg.peerDependencies != null && typeof pkg.peerDependencies === 'object') {
        for (const pkgName in pkg.peerDependencies) recurse(pkgName, target);
      }
    }
  };
  recurse(pkgName, undefined);
  return [...folders];
}
