import path from 'path';

import type { ModuleDescriptorCLIPlugin, PackageRevision } from '../types';

export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision
): Promise<ModuleDescriptorCLIPlugin | null> {
  const cliConfig = revision.config?.toJSON().cli;
  if (cliConfig == null) {
    return null;
  }

  return {
    packageName,
    packageRoot: revision.path,
    ...cliConfig,
  };
}
