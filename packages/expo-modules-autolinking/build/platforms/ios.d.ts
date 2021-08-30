import { ModuleDescriptor, PackageRevision, SearchOptions } from '../types';
/**
 * Resolves module search result with additional details required for iOS platform.
 */
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision, options: SearchOptions): Promise<ModuleDescriptor | null>;
/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptor[], targetPath: string): Promise<void>;
