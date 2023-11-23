import { PackageManagerOptions } from '../PackageManager';
import { BunPackageManager } from '../node/BunPackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';
export type NodePackageManager = NpmPackageManager | PnpmPackageManager | YarnPackageManager | BunPackageManager;
export type NodePackageManagerForProject = PackageManagerOptions & Partial<Record<NodePackageManager['name'], boolean>>;
/** The order of the package managers to use when resolving automatically */
export declare const RESOLUTION_ORDER: NodePackageManager['name'][];
/**
 * Resolve the workspace root for a project, if its part of a monorepo.
 * Optionally, provide a specific packager to only resolve that one specifically.
 */
export declare function findWorkspaceRoot(projectRoot: string, preferredManager?: NodePackageManager['name']): string | null;
/**
 * Resolve the used node package manager for a project by checking the lockfile.
 * This also tries to resolve the workspace root, if its part of a monorepo.
 * Optionally, provide a preferred packager to only resolve that one specifically.
 */
export declare function resolvePackageManager(projectRoot: string, preferredManager?: NodePackageManager['name']): NodePackageManager['name'] | null;
/**
 * Resolve the currently used node package manager.
 * This is done through the `npm_config_user_agent` environment variable.
 */
export declare function resolveCurrentPackageManager(): NodePackageManager['name'] | null;
/**
 * This creates a Node package manager from the provided options.
 * If these options are not provided, it will resolve the package manager based on these rules:
 *   1. Resolve the package manager based on the currently used package manager (process.env.npm_config_user_agent)
 *   2. If none, resolve the package manager based on the lockfiles in the project root
 *   3. If none, fallback to npm
 */
export declare function createForProject(projectRoot: string, options?: NodePackageManagerForProject): NodePackageManager;
