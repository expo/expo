import { sync as findUpSync } from 'find-up';
import findYarnOrNpmWorkspaceRoot from 'find-yarn-workspace-root';
import { existsSync } from 'fs';
import path from 'path';

import type { NodePackageManager } from '../NodePackageManagers';

export const NPM_LOCK_FILE = 'package-lock.json';
export const YARN_LOCK_FILE = 'yarn.lock';
export const PNPM_LOCK_FILE = 'pnpm-lock.yaml';
export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';
export const managerResolutionOrder: NodePackageManager[] = ['yarn', 'npm', 'pnpm'];

/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
function findPnpmWorkspaceRoot(projectRoot: string) {
  const workspaceEnvName = 'NPM_CONFIG_WORKSPACE_DIR';

  const workspaceEnvValue =
    process.env[workspaceEnvName] ?? process.env[workspaceEnvName.toLowerCase()];
  const manifestLocation = workspaceEnvValue
    ? path.join(workspaceEnvValue, PNPM_WORKSPACE_FILE)
    : findUpSync(PNPM_WORKSPACE_FILE, { cwd: projectRoot });

  return manifestLocation ? path.dirname(manifestLocation) : null;
}

/** Wraps `findYarnOrNpmWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
export function findYarnOrNpmWorkspaceRootSafe(projectRoot: string): string | null {
  try {
    return findYarnOrNpmWorkspaceRoot(projectRoot);
  } catch (error: any) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}

/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 *
 * By default, this tries to resolve the workspaces in order of:
 *  - npm
 *  - yarn
 *  - pnpm
 */
export function findWorkspaceRoot(
  projectRoot: string,
  packageManager?: NodePackageManager
): string | null {
  const strategies: Record<NodePackageManager, (projectRoot: string) => string | null> = {
    npm: findYarnOrNpmWorkspaceRootSafe,
    yarn: findYarnOrNpmWorkspaceRootSafe,
    pnpm: findPnpmWorkspaceRoot,
  };

  if (packageManager) {
    return strategies[packageManager](projectRoot);
  }

  for (const strategy of managerResolutionOrder.map(name => strategies[name])) {
    const root = strategy(projectRoot);
    if (root) {
      return root;
    }
  }

  return null;
}

/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 *
 * By default, this tries to resolve the workspaces in order of:
 *  - npm
 *  - yarn
 *  - pnpm
 */
export function resolvePackageManager(
  projectRoot: string,
  packageManager?: NodePackageManager
): NodePackageManager | null {
  const workspaceRoot = findWorkspaceRoot(projectRoot, packageManager) || projectRoot;
  const lockfileNames: Record<NodePackageManager, string> = {
    npm: NPM_LOCK_FILE,
    yarn: YARN_LOCK_FILE,
    pnpm: PNPM_LOCK_FILE,
  };

  if (packageManager) {
    const lockfilePath = path.join(workspaceRoot, lockfileNames[packageManager]);
    if (existsSync(lockfilePath)) {
      return packageManager;
    }
    return null;
  }

  for (const manager of managerResolutionOrder) {
    const lockfilePath = path.join(workspaceRoot, lockfileNames[manager]);
    if (existsSync(lockfilePath)) {
      return manager;
    }
  }

  return null;
}

/**
 * Returns true if the project is using yarn, false if the project is using another package manager.
 */
export function isUsingYarn(projectRoot: string): boolean {
  return !!resolvePackageManager(projectRoot, 'yarn');
}

/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 */
export function isUsingNpm(projectRoot: string): boolean {
  return !!resolvePackageManager(projectRoot, 'npm');
}
