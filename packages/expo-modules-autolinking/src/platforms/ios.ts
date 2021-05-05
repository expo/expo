import glob from 'fast-glob';
import path from 'path';

import { ModuleDescriptor, PackageRevision, SearchOptions } from '../types';

/**
 * Resolves module search result with additional details required for iOS platform.
 */
export async function resolveModuleAsync(
  packageName: string,
  revision: PackageRevision,
  options: SearchOptions
): Promise<ModuleDescriptor | null> {
  const [podspecFile] = await glob('*/*.podspec', {
    cwd: revision.path,
    ignore: ['**/node_modules/**'],
  });

  if (!podspecFile) {
    return null;
  }

  const podName = path.basename(podspecFile, path.extname(podspecFile));
  const podspecDir = path.dirname(path.join(revision.path, podspecFile));

  return {
    podName,
    podspecDir,
    flags: options.flags,
  };
}
