import JsonFile from '@expo/json-file';
import { resolveFrom } from '@expo/require-utils';

export function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  // The copy in `node_modules` is the one Metro bundles, whatever the package's `exports` expose
  const targetPkgJson = resolveFrom(projectRoot, `${pkgName}/package.json`, {
    skipNodePath: true,
  });
  if (!targetPkgJson) return null;
  const pkg = JsonFile.read(targetPkgJson);
  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }
  return null;
}
