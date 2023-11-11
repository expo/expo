import path from 'path';

import { ModuleDescriptorDevTools, PackageRevision } from '../types';

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
