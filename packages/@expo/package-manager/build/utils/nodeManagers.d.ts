import { PackageManagerOptions } from '../PackageManager';
import { BunPackageManager } from '../node/BunPackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';
export { resolveWorkspaceRoot } from 'resolve-workspace-root';
export type NodePackageManager = NpmPackageManager | PnpmPackageManager | YarnPackageManager | BunPackageManager;
export type NodePackageManagerForProject = PackageManagerOptions & Partial<Record<NodePackageManager['name'], boolean>>;
export declare const NPM_LOCK_FILE = "package-lock.json";
export declare const YARN_LOCK_FILE = "yarn.lock";
export declare const PNPM_LOCK_FILE = "pnpm-lock.yaml";
export declare const BUN_LOCK_FILE = "bun.lockb";
/** The order of the package managers to use when resolving automatically */
export declare const RESOLUTION_ORDER: NodePackageManager['name'][];
/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a preferred packager to only resolve that one specifically.
 */
export declare function resolvePackageManager(projectRoot: string, preferredManager?: NodePackageManager['name']): NodePackageManager['name'] | null;
/**
 * This creates a Node package manager from the provided options.
 * If these options are not provided, it will infer the package manager from lockfiles.
 * When no package manager is found, it falls back to npm.
 */
export declare function createForProject(projectRoot: string, options?: NodePackageManagerForProject): NodePackageManager;
