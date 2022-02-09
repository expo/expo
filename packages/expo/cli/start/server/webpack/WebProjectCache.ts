import * as path from 'path';

import * as Log from '../../../log';
import { removeAsync } from '../../../utils/dir';

export function getWebProjectCachePath(projectRoot: string, mode: string = 'development'): string {
  return path.join(projectRoot, '.expo', 'web', 'cache', mode);
}

export async function clearWebProjectCacheAsync(
  projectRoot: string,
  mode: string = 'development'
): Promise<void> {
  const cacheFolder = getWebProjectCachePath(projectRoot, mode);
  try {
    await removeAsync(cacheFolder);
  } catch (e) {
    Log.error(`Could not clear ${mode} web cache directory: ${e.message}`);
  }
}
