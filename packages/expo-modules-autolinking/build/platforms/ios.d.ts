import { ModuleDescriptorIos, PackageRevision, SearchOptions } from '../types';
/**
 * Resolves module search result with additional details required for iOS platform.
 */
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision, options: SearchOptions): Promise<ModuleDescriptorIos | null>;
/**
 * Generates Swift file that contains all autolinked Swift packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptorIos[], targetPath: string): Promise<void>;
