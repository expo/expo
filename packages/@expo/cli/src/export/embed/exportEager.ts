import { exportEmbedInternalAsync } from './exportEmbedAsync';
import { getExportEmbedOptionsKey, resolveEagerOptionsAsync } from './resolveOptions';
import { env } from '../../utils/env';
import { AbortCommandError } from '../../utils/errors';

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
    resetCache: !env.CI,
  });
  debug('Starting eager export: ' + options.bundleOutput);
  try {
    await exportEmbedInternalAsync(projectRoot, options);
    // TODO: Compose source maps
  } catch (error: any) {
    // ctrl+c
    if (error.signal === 'SIGINT') {
      throw new AbortCommandError();
    }
    throw error;
  }

  debug('Eager export complete');

  return { options, key: getExportEmbedOptionsKey(options) };
}
