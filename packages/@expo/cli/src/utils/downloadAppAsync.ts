import fs from 'fs';
import path from 'path';
import { Stream } from 'stream';
import temporary from 'tempy';
import { promisify } from 'util';

import { ensureDirectoryAsync } from './dir';
import { CommandError } from './errors';
import { extractAsync } from './tar';
import { createCachedFetch, fetchAsync } from '../api/rest/client';
import { FetchLike, ProgressCallback } from '../api/rest/client.types';

const debug = require('debug')('expo:utils:downloadAppAsync') as typeof console.log;

const TIMER_DURATION = 30000;

const pipeline = promisify(Stream.pipeline);

async function downloadAsync({
  url,
  outputPath,
  cacheDirectory,
  onProgress,
}: {
  url: string;
  outputPath: string;
  cacheDirectory?: string;
  onProgress?: ProgressCallback;
}) {
  let fetchInstance: FetchLike = fetchAsync;
  if (cacheDirectory) {
    // Reconstruct the cached fetch since caching could be disabled.
    fetchInstance = createCachedFetch({
      // We'll use a 1 week cache for versions so older values get flushed out eventually.
      ttl: 1000 * 60 * 60 * 24 * 7,
      // Users can also nuke their `~/.expo` directory to clear the cache.
      cacheDirectory,
    });
  }

  debug(`Downloading ${url} to ${outputPath}`);
  const res = await fetchInstance(url, {
    timeout: TIMER_DURATION,
    onProgress,
  });
  if (!res.ok) {
    throw new CommandError(
      'FILE_DOWNLOAD',
      `Unexpected response: ${res.statusText}. From url: ${url}`
    );
  }
  return pipeline(res.body, fs.createWriteStream(outputPath));
}

export async function downloadAppAsync({
  url,
  outputPath,
  extract = false,
  cacheDirectory,
  onProgress,
}: {
  url: string;
  outputPath: string;
  extract?: boolean;
  cacheDirectory?: string;
  onProgress?: ProgressCallback;
}): Promise<void> {
  if (extract) {
    // For iOS we download the ipa to a file then pass that file into the extractor.
    // In the future we should just pipe the `res.body -> tar.extract` directly.
    // I tried this and it created some weird errors where observing the data stream
    // would corrupt the file causing tar to fail with `TAR_BAD_ARCHIVE`.
    const tmpPath = temporary.file({ name: path.basename(outputPath) });
    await downloadAsync({ url, outputPath: tmpPath, cacheDirectory, onProgress });
    debug(`Extracting ${tmpPath} to ${outputPath}`);
    await ensureDirectoryAsync(outputPath);
    await extractAsync(tmpPath, outputPath);
  } else {
    await ensureDirectoryAsync(path.dirname(outputPath));
    await downloadAsync({ url, outputPath, cacheDirectory, onProgress });
  }
}
