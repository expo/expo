import { sync as findUpSync } from 'find-up';
import findYarnOrNpmWorkspaceRoot from 'find-yarn-workspace-root';
import fs from 'fs';
import path from 'path';

import { PackageManagerOptions } from '../PackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';

// TODO(cedric): check if we can clean up this file and reuse the package manager methods, like `workspaceRootAsync`

export const NPM_LOCK_FILE = 'package-lock.json';
export const YARN_LOCK_FILE = 'yarn.lock';
export const PNPM_LOCK_FILE = 'pnpm-lock.yaml';
export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';

/** The order of the package managers to use when resolving automatically */
export const RESOLUTION_ORDER: NodePackageManager['name'][] = ['yarn', 'npm', 'pnpm'];

export type NodePackageManager = NpmPackageManager | PnpmPackageManager | YarnPackageManager;

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
  packageManager?: NodePackageManager['name']
): string | null {
  const strategies: Record<NodePackageManager['name'], (projectRoot: string) => string | null> = {
    npm: findYarnOrNpmWorkspaceRootSafe,
    yarn: findYarnOrNpmWorkspaceRootSafe,
    pnpm: findPnpmWorkspaceRoot,
  };

  if (packageManager) {
    return strategies[packageManager](projectRoot);
  }

  for (const strategy of RESOLUTION_ORDER.map((name) => strategies[name])) {
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
  packageManager?: NodePackageManager['name']
): NodePackageManager['name'] | null {
  const workspaceRoot = findWorkspaceRoot(projectRoot, packageManager) || projectRoot;
  const lockfileNames: Record<NodePackageManager['name'], NodePackageManager['lockFile']> = {
    npm: NPM_LOCK_FILE,
    pnpm: PNPM_LOCK_FILE,
    yarn: YARN_LOCK_FILE,
  };

  if (packageManager) {
    const lockfilePath = path.join(workspaceRoot, lockfileNames[packageManager]);
    if (fs.existsSync(lockfilePath)) {
      return packageManager;
    }
    return null;
  }

  for (const manager of RESOLUTION_ORDER) {
    const lockfilePath = path.join(workspaceRoot, lockfileNames[manager]);
    if (fs.existsSync(lockfilePath)) {
      return manager;
    }
  }

  return null;
}

/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export function isUsingNpm(projectRoot: string): boolean {
  return !!resolvePackageManager(projectRoot, 'npm');
}

/**
 * Returns true if the project is using pnpm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export function isUsingPnpm(projectRoot: string): boolean {
  return !!resolvePackageManager(projectRoot, 'pnpm');
}

/**
 * Returns true if the project is using yarn, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export function isUsingYarn(projectRoot: string): boolean {
  return !!resolvePackageManager(projectRoot, 'yarn');
}

export type CreateFromOptions = PackageManagerOptions &
  Partial<Record<NodePackageManager['name'], boolean>>;

/**
 * This creates a Node package manager from the provided options.
 * If all of these options are non-true, it will fallback to `nodeManagerFromProject`.
 */
export function createFromOptions(
  projectRoot: string,
  options: CreateFromOptions = {}
): NodePackageManager {
  let manager;

  if (options.npm) {
    manager = NpmPackageManager;
  } else if (options.yarn) {
    manager = YarnPackageManager;
  } else if (options.pnpm) {
    manager = PnpmPackageManager;
  }

  return manager
    ? new manager({ cwd: projectRoot, ...options })
    : createForProject(projectRoot, options);
}

/**
 * Create a Node package manager by infering the project's lockfiles.
 * If none is found, it will fallback to the npm package manager.
 */
export function createForProject(
  projectRoot: string,
  options: PackageManagerOptions
): NodePackageManager {
  const managerOptions = { cwd: projectRoot, ...options };

  switch (resolvePackageManager(projectRoot)) {
    case 'npm':
      return new NpmPackageManager(managerOptions);
    case 'pnpm':
      return new PnpmPackageManager(managerOptions);
    case 'yarn':
      return new YarnPackageManager(managerOptions);
    default:
      return new NpmPackageManager(managerOptions);
  }
}
