import path from 'path';

import type { ExtraDependencies, ModuleDescriptorDevTools, PackageRevision } from '../types';

export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision
): Promise<ModuleDescriptorDevTools | null> {
  const devtoolsConfig = revision.config?.toJSON().devtools;
  if (devtoolsConfig == null) {
    return null;
  }

  return {
    packageName,
    packageRoot: revision.path,
    webpageRoot: path.join(revision.path, devtoolsConfig.webpageRoot),
  };
}

export async function resolveExtraBuildDependenciesAsync(
  _projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  return null;
}
