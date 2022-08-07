import type { NodePackageManager } from '../NodePackageManagers';
export declare const NPM_LOCK_FILE = "package-lock.json";
export declare const YARN_LOCK_FILE = "yarn.lock";
export declare const PNPM_LOCK_FILE = "pnpm-lock.yaml";
export declare const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 *
 * By default, this tries to resolve the workspaces in order of:
 *  - npm
 *  - yarn
 *  - pnpm
 */
export declare function findWorkspaceRoot(projectRoot: string, packageManager?: NodePackageManager): string | null;
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
export declare function resolvePackageManager(projectRoot: string, packageManager?: NodePackageManager): NodePackageManager | null;
/**
 * Check if the project, or workspace root, is using Yarn.
 * @deprecated Please use `resolvePackageManager` instead to resolve either npm, yarn, or pnpm.
 */
export declare function isUsingYarn(projectRoot: string): boolean;
