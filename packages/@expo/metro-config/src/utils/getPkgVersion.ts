import JsonFile from '@expo/json-file';
import { resolveFrom } from '@expo/require-utils';

export function getPkgVersion(
  projectRoot: string,
  pkgName: string,
  peerDependent?: string
): string | null {
  let pkgPath: string | null = null;

  pkgPath = resolveFrom(projectRoot, `${pkgName}/package.json`);
  if (!pkgPath && peerDependent) {
    const peerDependentPath = resolveFrom(projectRoot, `${peerDependent}/package.json`);
    if (peerDependentPath) {
      pkgPath = resolveFrom(peerDependentPath, `${pkgName}/package.json`);
    }
  }

  if (!pkgPath) {
    return null;
  }

  const pkg = JsonFile.read(pkgPath);
  return pkg && typeof pkg?.version === 'string' ? pkg.version : null;
}
