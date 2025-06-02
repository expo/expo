import type { ModuleDescriptorCLIPlugin, PackageRevision } from '../types';
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorCLIPlugin | null>;
