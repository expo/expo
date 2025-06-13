import type { ModuleDescriptorCliCommandPlugin, PackageRevision } from '../types';
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorCliCommandPlugin | null>;
