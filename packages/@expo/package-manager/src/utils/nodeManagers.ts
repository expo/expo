import fs from 'fs';
import path from 'path';

import {
  findPnpmWorkspaceRoot,
  findYarnOrNpmWorkspaceRoot,
  NPM_LOCK_FILE,
  PNPM_LOCK_FILE,
  YARN_LOCK_FILE,
  BUN_LOCK_FILE,
} from './nodeWorkspaces';
import { PackageManagerOptions } from '../PackageManager';
import { BunPackageManager } from '../node/BunPackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';

export type NodePackageManager =
  | NpmPackageManager
  | PnpmPackageManager
  | YarnPackageManager
  | BunPackageManager;

export type NodePackageManagerForProject = PackageManagerOptions &
  Partial<Record<NodePackageManager['name'], boolean>>;

/** The order of the package managers to use when resolving automatically */
export const RESOLUTION_ORDER: NodePackageManager['name'][] = ['bun', 'yarn', 'npm', 'pnpm'];

/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 */
export function findWorkspaceRoot(
  projectRoot: string,
  preferredManager?: NodePackageManager['name']
): string | null {
  const strategies: Record<NodePackageManager['name'], (projectRoot: string) => string | null> = {
    npm: findYarnOrNpmWorkspaceRoot,
    yarn: findYarnOrNpmWorkspaceRoot,
    pnpm: findPnpmWorkspaceRoot,
    bun: findYarnOrNpmWorkspaceRoot,
  };

  if (preferredManager) {
    return strategies[preferredManager](projectRoot);
  }

  for (const strategy of RESOLUTION_ORDER) {
    const root = strategies[strategy](projectRoot);
    if (root) {
      return root;
    }
  }

  return null;
}

/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a preferred packager to only resolve that one specifically.
 */
export function resolvePackageManager(
  projectRoot: string,
  preferredManager?: NodePackageManager['name']
): NodePackageManager['name'] | null {
  const root = findWorkspaceRoot(projectRoot, preferredManager) ?? projectRoot;
  const lockFiles: Record<NodePackageManager['name'], string> = {
    npm: NPM_LOCK_FILE,
    pnpm: PNPM_LOCK_FILE,
    yarn: YARN_LOCK_FILE,
    bun: BUN_LOCK_FILE,
  };

  if (preferredManager) {
    if (fs.existsSync(path.join(root, lockFiles[preferredManager]))) {
      return preferredManager;
    }

    return null;
  }

  for (const managerName of RESOLUTION_ORDER) {
    if (fs.existsSync(path.join(root, lockFiles[managerName]))) {
      return managerName;
    }
  }

  return null;
}

/**
 * Resolve the currently used node package manager.
 * This is done through the `npm_config_user_agent` environment variable.
 */
export function resolveCurrentPackageManager(): NodePackageManager['name'] | null {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.startsWith('bun')) {
    return 'bun';
  } else if (userAgent.startsWith('npm')) {
    return 'npm';
  } else if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  } else if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  return null;
}

/**
 * This creates a Node package manager from the provided options.
 * If these options are not provided, it will resolve the package manager based on these rules:
 *   1. Resolve the package manager based on the currently used package manager (process.env.npm_config_user_agent)
 *   2. If none, resolve the package manager based on the lockfiles in the project root
 *   3. If none, fallback to npm
 */
export function createForProject(
  projectRoot: string,
  options: NodePackageManagerForProject = {}
): NodePackageManager {
  if (options.npm) {
    return new NpmPackageManager({ cwd: projectRoot, ...options });
  } else if (options.yarn) {
    return new YarnPackageManager({ cwd: projectRoot, ...options });
  } else if (options.pnpm) {
    return new PnpmPackageManager({ cwd: projectRoot, ...options });
  } else if (options.bun) {
    return new BunPackageManager({ cwd: projectRoot, ...options });
  }

  const resolvedManager = resolveCurrentPackageManager() ?? resolvePackageManager(projectRoot);

  switch (resolvedManager) {
    case 'npm':
      return new NpmPackageManager({ cwd: projectRoot, ...options });
    case 'pnpm':
      return new PnpmPackageManager({ cwd: projectRoot, ...options });
    case 'yarn':
      return new YarnPackageManager({ cwd: projectRoot, ...options });
    case 'bun':
      return new BunPackageManager({ cwd: projectRoot, ...options });
    default:
      return new NpmPackageManager({ cwd: projectRoot, ...options });
  }
}
