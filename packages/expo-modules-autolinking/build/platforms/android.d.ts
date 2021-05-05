import { ModuleDescriptor, PackageRevision } from '../types';
/**
 * Generates Java file that contains all autolinked packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptor[], targetPath: string, namespace: string): Promise<void>;
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptor | null>;
