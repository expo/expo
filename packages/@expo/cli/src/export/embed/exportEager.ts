import { env } from '../../utils/env';
import { debugEvent } from '../events';
import { exportEmbedInternalAsync } from './exportEmbedAsync';
import { getExportEmbedOptionsKey, resolveEagerOptionsAsync } from './resolveOptions';

export async function exportEagerAsync(
  projectRoot: string,
  {
    dev,
    platform,
    // We default to resetting the cache in non-CI environments since prebundling overwrites the cache reset later.
    resetCache = !env.CI,
    assetsDest,
    bundleOutput,
  }: {
    dev: boolean;
    platform: string;
    resetCache?: boolean;
    assetsDest?: string;
    bundleOutput?: string;
  }
) {
  const options = await resolveEagerOptionsAsync(projectRoot, {
    dev,
    platform,
    resetCache,
    assetsDest,
    bundleOutput,
  });
  debugEvent('eager:starting', { bundleOutput: options.bundleOutput });

  await exportEmbedInternalAsync(projectRoot, options);

  return { options, key: getExportEmbedOptionsKey(options) };
}
