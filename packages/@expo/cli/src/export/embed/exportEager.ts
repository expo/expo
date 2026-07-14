import { env } from '../../utils/env';
import { exportEmbedInternalAsync } from './exportEmbedAsync';
import { getExportEmbedOptionsKey, resolveEagerOptionsAsync } from './resolveOptions';

const debug = require('debug')('expo:eager');

export async function exportEagerAsync(
  projectRoot: string,
  {
    dev,
    platform,
    // We default to resetting the cache in non-CI environments since prebundling overwrites the cache reset later.
    // Local EAS production builds also reset it: `eas build --local` reuses a persistent machine where a stale Metro
    // cache survives across builds, so cached transforms can reference generated files (e.g. worklets bundle-mode
    // `.worklets/<hash>.js`) that a fresh checkout never regenerated.
    resetCache = !env.CI || (!dev && env.EAS_BUILD_RUNNER === 'local-build-plugin'),
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
  debug('Starting eager export: ' + options.bundleOutput);

  await exportEmbedInternalAsync(projectRoot, options);

  debug('Eager export complete');

  return { options, key: getExportEmbedOptionsKey(options) };
}
