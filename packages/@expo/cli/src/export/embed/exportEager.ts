import { exportEmbedInternalAsync } from './exportEmbedAsync';
import { getExportEmbedOptionsKey, resolveEagerOptionsAsync } from './resolveOptions';
import { env } from '../../utils/env';

const debug = require('debug')('expo:eager');

export async function exportEagerAsync(
  projectRoot: string,
  {
    dev,
    platform,
  }: {
    dev: boolean;
    platform: string;
  }
) {
  const options = await resolveEagerOptionsAsync(projectRoot, {
    dev,
    platform,
    // We default to resetting the cache in non-CI environments since prebundling overwrites the cache reset later.
    resetCache: false, //!env.CI,
  });
  debug('Starting eager export: ' + options.bundleOutput);

  await exportEmbedInternalAsync(projectRoot, options);

  debug('Eager export complete');

  return { options, key: getExportEmbedOptionsKey(options) };
}
