import JsonFile from '@expo/json-file';
import path from 'path';
import resolveFrom from 'resolve-from';

export function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  const targetPkg = resolveFrom.silent(projectRoot, pkgName);
  if (!targetPkg) return null;
  const targetPkgJson = findUpPackageJson(targetPkg);
  if (!targetPkgJson) return null;
  const pkg = JsonFile.read(targetPkgJson);

  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }

  return null;
}

export function findUpPackageJson(cwd: string): string | null {
  if (['.', path.sep].includes(cwd)) return null;

  const found = resolveFrom.silent(cwd, './package.json');
  if (found) {
    return found;
  }
  return findUpPackageJson(path.dirname(cwd));
}
