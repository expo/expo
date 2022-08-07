import type { NodePackageManager } from '../NodePackageManagers';
export declare const NPM_LOCK_FILE = "package-lock.json";
export declare const YARN_LOCK_FILE = "yarn.lock";
export declare const PNPM_LOCK_FILE = "pnpm-lock.yaml";
export declare const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
export declare const managerResolutionOrder: NodePackageManager[];
/** Wraps `findYarnOrNpmWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
export declare function findYarnOrNpmWorkspaceRootSafe(projectRoot: string): string | null;
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
 * Returns true if the project is using yarn, false if the project is using another package manager.
 */
export declare function isUsingYarn(projectRoot: string): boolean;
/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 */
export declare function isUsingNpm(projectRoot: string): boolean;
