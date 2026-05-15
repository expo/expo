import path from 'path';

import type { ExtraDependencies, ModuleDescriptorDevTools, PackageRevision } from '../types';
import { isPathInside } from '../utils';

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
    webpageRoot: resolveWebpageRoot(revision.path, devtoolsConfig.webpageRoot),
    cliExtensions: devtoolsConfig.cliExtensions,
  };
}

function resolveWebpageRoot(
  packageRoot: string,
  configured: string | undefined
): string | undefined {
  if (!configured) {
    return undefined;
  }
  const joined = path.join(packageRoot, configured);
  return isPathInside(joined, packageRoot) ? joined : undefined;
}

export async function resolveExtraBuildDependenciesAsync(
  _projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  return null;
}
