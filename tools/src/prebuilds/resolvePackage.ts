import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';

/**
 * Resolves the filesystem path to an npm package that isn't a direct dependency
 * of the tools package. Tries apps/bare-expo first (direct deps like react-native),
 * then react-native's own directory (transitive deps like @react-native/codegen).
 */
export function resolvePackagePath(packageName: string): string {
  const appDir = path.join(getExpoRepositoryRootDir(), 'apps', 'bare-expo');
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [appDir] }));
  } catch {
    // For transitive dependencies (e.g. @react-native/codegen), resolve from react-native's directory
    const rnDir = path.dirname(require.resolve('react-native/package.json', { paths: [appDir] }));
    return path.dirname(require.resolve(`${packageName}/package.json`, { paths: [rnDir] }));
  }
}
