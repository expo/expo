import JsonFile from '@expo/json-file';
import { resolveFrom } from '@expo/require-utils';

export function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  const targetPkgMeta = resolveFrom(projectRoot, `${pkgName}/package.json`);
  if (!targetPkgMeta) return null;
  const pkg = JsonFile.read(targetPkgMeta);
  return pkg && typeof pkg?.version === 'string' ? pkg.version : null;
}
