import path from 'path';

import type { ExtraDependencies, ModuleDescriptorDevTools, PackageRevision } from '../types';
import { isPathInside, maybeRealpath } from '../utils';

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
    webpageRoot: await resolveWebpageRoot(revision.path, devtoolsConfig.webpageRoot),
    webpageBanner: devtoolsConfig.webpageBanner ?? false,
    cliExtensions: devtoolsConfig.cliExtensions,
  };
}

async function resolveWebpageRoot(
  packageRoot: string,
  configuredWebpageRoot: string | undefined
): Promise<string | undefined> {
  if (!configuredWebpageRoot) {
    return undefined;
  }
  const resolvedWebpageRoot = path.resolve(packageRoot, configuredWebpageRoot);
  // NOTE(@kitten): Failing realpath-ing, typically due to ENOENT, results in the original value
  const webpageRoot = (await maybeRealpath(resolvedWebpageRoot)) ?? resolvedWebpageRoot;
  return isPathInside(webpageRoot, packageRoot) ? webpageRoot : undefined;
}

export async function resolveExtraBuildDependenciesAsync(
  _projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  return null;
}
