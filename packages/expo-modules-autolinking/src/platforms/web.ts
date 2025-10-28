import type { ExtraDependencies, ModuleDescriptorWeb, PackageRevision } from '../types';

export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision
): Promise<ModuleDescriptorWeb | null> {
  return {
    packageName,
    packageRoot: revision.path,
  };
}

export async function resolveExtraBuildDependenciesAsync(
  _projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  return null;
}
