import path from 'path';
import resolveFrom from 'resolve-from';

let cachedCliPath: string | null = null;

/**
 * Resolve a module from the @expo/cli package.
 */
export function resolveFromExpoCli(projectRoot: string, moduleId: string): string {
  if (cachedCliPath == null) {
    const expoPackageRoot = path.dirname(resolveFrom(projectRoot, 'expo/package.json'));
    cachedCliPath = path.dirname(resolveFrom(expoPackageRoot, '@expo/cli/package.json'));
  }
  return path.join(cachedCliPath, moduleId);
}
