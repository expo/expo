import { ModuleDescriptorDevTools, PackageRevision } from '../types';
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorDevTools | null>;
