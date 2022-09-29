import { PackageManagerOptions } from '../PackageManager';
import { NpmPackageManager } from '../node/NpmPackageManager';
import { PnpmPackageManager } from '../node/PnpmPackageManager';
import { YarnPackageManager } from '../node/YarnPackageManager';
export declare type NodePackageManager = NpmPackageManager | PnpmPackageManager | YarnPackageManager;
export declare type NodePackageManagerFromOptions = PackageManagerOptions & Partial<Record<NodePackageManager['name'], boolean>>;
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
 * This creates a Node package manager from the provided options.
 * If all of these options are non-true, it will fallback to `createForProject`.
 */
export declare function createFromOptions(projectRoot: string, options?: NodePackageManagerFromOptions): NodePackageManager;
/**
 * Create a Node package manager by infering the project's lockfiles.
 * If none is found, it will fallback to the npm package manager.
 */
export declare function createForProject(projectRoot: string, options?: PackageManagerOptions): NodePackageManager;
