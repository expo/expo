import { PackageManagerOptions } from '../PackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';
export declare const NPM_LOCK_FILE = "package-lock.json";
export declare const YARN_LOCK_FILE = "yarn.lock";
export declare const PNPM_LOCK_FILE = "pnpm-lock.yaml";
export declare const PNPM_WORKSPACE_FILE = "pnpm-workspace.yaml";
/** The order of the package managers to use when resolving automatically */
export declare const RESOLUTION_ORDER: NodePackageManager['name'][];
export declare type NodePackageManager = NpmPackageManager | PnpmPackageManager | YarnPackageManager;
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
export declare function findWorkspaceRoot(projectRoot: string, packageManager?: NodePackageManager['name']): string | null;
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
export declare function resolvePackageManager(projectRoot: string, packageManager?: NodePackageManager['name']): NodePackageManager['name'] | null;
/**
 * Returns true if the project is using npm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export declare function isUsingNpm(projectRoot: string): boolean;
/**
 * Returns true if the project is using pnpm, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export declare function isUsingPnpm(projectRoot: string): boolean;
/**
 * Returns true if the project is using yarn, false if the project is using another package manager.
 * @deprecated use `reaolvePackageManager` instead
 */
export declare function isUsingYarn(projectRoot: string): boolean;
export declare type CreateFromOptions = PackageManagerOptions & Partial<Record<NodePackageManager['name'], boolean>>;
/**
 * This creates a Node package manager from the provided options.
 * If all of these options are non-true, it will fallback to `nodeManagerFromProject`.
 */
export declare function createFromOptions(projectRoot: string, options?: CreateFromOptions): NodePackageManager;
/**
 * Create a Node package manager by infering the project's lockfiles.
 * If none is found, it will fallback to the npm package manager.
 */
export declare function createForProject(projectRoot: string, options: PackageManagerOptions): NodePackageManager;
