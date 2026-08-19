import JsonFile from '@expo/json-file';
import resolveFrom from 'resolve-from';

import { findUpPackageJsonPath } from './findUpPackageJsonPath';

export function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  const targetPkg = resolveFrom.silent(projectRoot, pkgName);
  if (!targetPkg) return null;
  const targetPkgJson = findUpPackageJsonPath(targetPkg);
  if (!targetPkgJson) return null;
  const pkg = JsonFile.read(targetPkgJson);
  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }
  return null;
}
