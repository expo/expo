import { resolveFrom } from '@expo/require-utils';
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
    webpageRoot: await resolvePackageLocalWebpageRoot(revision.path, devtoolsConfig.webpageRoot),
    bannerTitle: devtoolsConfig.bannerTitle,
    serverEntryPoint: await resolvePackageLocalPath(revision.path, devtoolsConfig.serverEntryPoint),
    cliExtensions: devtoolsConfig.cliExtensions,
  };
}

async function resolvePackageLocalPath(
  packageRoot: string,
  configuredPath: string | undefined
): Promise<string | undefined> {
  if (!configuredPath) {
    return undefined;
  }
  const resolvedPath = resolveFrom(packageRoot, configuredPath);
  if (!resolvedPath) {
    return undefined;
  }

  return isPathInside(resolvedPath, packageRoot) ? resolvedPath : undefined;
}

async function resolvePackageLocalWebpageRoot(
  packageRoot: string,
  configuredPath: string | undefined
): Promise<string | undefined> {
  if (!configuredPath) {
    return undefined;
  }

  const resolvedPath = path.resolve(packageRoot, configuredPath);
  // NOTE(@kitten): Failing realpath-ing, typically due to ENOENT, results in the original value
  const realPath = (await maybeRealpath(resolvedPath)) ?? resolvedPath;
  return isPathInside(realPath, packageRoot) ? realPath : undefined;
}

export async function resolveExtraBuildDependenciesAsync(
  _projectNativeRoot: string
): Promise<ExtraDependencies | null> {
  return null;
}
