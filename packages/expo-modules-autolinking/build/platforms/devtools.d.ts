import type { ExtraDependencies, ModuleDescriptorDevTools, PackageRevision } from '../types';
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorDevTools | null>;
export declare function resolveExtraBuildDependenciesAsync(_projectNativeRoot: string): Promise<ExtraDependencies | null>;
