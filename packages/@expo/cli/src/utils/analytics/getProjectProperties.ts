import { ExpoConfig } from '@expo/config';
import { findWorkspaceRoot, resolvePackageManager } from '@expo/package-manager';
import path from 'path';

/**
 * Resolve the package resolutions or overrides for the workspace root.
 *   - yarn uses resolutions (https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/)
 *   - npm uses overrides (https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides)
 *   - pnpm uses overrides (https://pnpm.io/package_json#pnpmoverrides)
 */
function getPackageResolutions(workspaceRoot: string) {
  try {
    const pkg = require(path.join(workspaceRoot, 'package.json'));
    return pkg.resolutions ?? pkg.overrides ?? null;
  } catch {
    return null;
  }
}

export function getProjectProperties(projectRoot: string, exp: ExpoConfig) {
  const workspaceRoot = findWorkspaceRoot(projectRoot);
  return {
    sdkVersion: exp.sdkVersion ?? null,
    isMonorepo: workspaceRoot !== null,
    packageManager: resolvePackageManager(projectRoot),
    packageResolutions: getPackageResolutions(workspaceRoot ?? projectRoot),
  };
}
