import { sync as findUpSync } from 'find-up';
import findYarnOrNpmWorkspaceRootUnsafe from 'find-yarn-workspace-root';
import fs from 'fs';
import yaml from 'js-yaml';
import micromatch from 'micromatch';
import path from 'path';

export const NPM_LOCK_FILE = 'package-lock.json';
export const YARN_LOCK_FILE = 'yarn.lock';
export const PNPM_LOCK_FILE = 'pnpm-lock.yaml';
export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';

/** Wraps `find-yarn-workspace-root` and guards against having an empty `package.json` file in an upper directory. */
export function findYarnOrNpmWorkspaceRoot(projectRoot: string): string | null {
  try {
    return findYarnOrNpmWorkspaceRootUnsafe(projectRoot);
  } catch (error: any) {
    if (error.message.includes('Unexpected end of JSON input')) {
      return null;
    }
    throw error;
  }
}

/**
 * Find the `pnpm-workspace.yaml` file that represents the root of the monorepo.
 * This is a synchronous function based on the original async library.
 * @see https://github.com/pnpm/pnpm/blob/main/packages/find-workspace-dir/src/index.ts
 */
export function findPnpmWorkspaceRoot(projectRoot: string): string | null {
  const workspaceEnvName = 'NPM_CONFIG_WORKSPACE_DIR';
  const workspaceEnvValue =
    process.env[workspaceEnvName] ?? process.env[workspaceEnvName.toLowerCase()];

  const workspaceFile = workspaceEnvValue
    ? path.join(workspaceEnvValue, PNPM_WORKSPACE_FILE)
    : findUpSync(PNPM_WORKSPACE_FILE, { cwd: projectRoot });

  if (!workspaceFile || !fs.existsSync(workspaceFile)) {
    return null;
  }

  try {
    // See: https://pnpm.io/pnpm-workspace_yaml
    const { packages: workspaces } = yaml.load(fs.readFileSync(workspaceFile, 'utf8'));
    // See: https://github.com/square/find-yarn-workspace-root/blob/11f6e31d3fa15a5bb7b7419f0091390e4c16204c/index.js#L26-L33
    const workspaceRoot = path.dirname(workspaceFile);
    const relativePath = path.relative(workspaceRoot, projectRoot);

    if (relativePath === '' || micromatch([relativePath], workspaces).length > 0) {
      return workspaceRoot;
    }
  } catch {
    // TODO: implement debug logger?
    return null;
  }

  return null;
}
