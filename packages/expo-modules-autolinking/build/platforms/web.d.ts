import type { ExtraDependencies, ModuleDescriptorWeb, PackageRevision } from '../types';
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorWeb | null>;
export declare function resolveExtraBuildDependenciesAsync(_projectNativeRoot: string): Promise<ExtraDependencies | null>;
