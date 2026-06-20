import JsonFile from '@expo/json-file';
import path from 'path';
import resolveFrom from 'resolve-from';

export function getPkgVersion(projectRoot: string, pkgName: string): string | null {
  const targetPkg = resolveFrom.silent(projectRoot, pkgName);
  if (!targetPkg) return null;
  const targetPkgJson = findUpPackageJson(targetPkg);
  if (!targetPkgJson) return null;
  return getPkgVersionFromPath(targetPkgJson);
}

export function getPkgVersionFromPath(packageJsonPath: string): string | null {
  const pkg = JsonFile.read(packageJsonPath);
  const pkgVersion = pkg.version;
  if (typeof pkgVersion === 'string') {
    return pkgVersion;
  }
  return null;
}

export function findUpPackageJson(cwd: string): string | null {
  // Stop when we reach a directory whose parent is itself, e.g. the POSIX root `/` or a
  // Windows drive root like `D:\`. `path.dirname('D:\\')` returns `'D:\\'`, which is neither
  // `.` nor `path.sep`, so checking only against those values would recurse forever on Windows
  // when no package.json exists up the tree. The sibling helpers in
  // serializer/findUpPackageJsonPath.ts and install-expo-modules/src/utils/projectRoot.ts use
  // this same `path.dirname(dir) !== dir` idiom.
  const parent = path.dirname(cwd);
  if (parent === cwd || cwd === '.') return null;

  const found = resolveFrom.silent(cwd, './package.json');
  if (found) {
    return found;
  }
  return findUpPackageJson(parent);
}
