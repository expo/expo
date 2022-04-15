import spawnAsync from '@expo/spawn-async';
import ProgressBar from 'progress';
import stream from 'stream';
import tar from 'tar';
import { promisify } from 'util';

import { fetchAsync } from '../api/rest/client';
import * as Log from '../log';
import { CommandError } from './errors';
import { setProgressBar } from './progress';

const pipeline = promisify(stream.pipeline);

/** Extract a tar using built-in tools if available and falling back on Node.js. */
export async function extractAsync(input: string, output: string): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      await spawnAsync('tar', ['-xf', input, '-C', output], {
        stdio: 'inherit',
      });
      return;
    }
  } catch (error: any) {
    Log.warn(
      `Failed to extract tar using native tools, falling back on JS tar module. ${error.message}`
    );
  }
  // tar node module has previously had problems with big files, and seems to
  // be slower, so only use it as a backup.
  await tar.extract({ file: input, cwd: output });
}

/**
 * Download a tar.gz file and extract it to a folder.
 *
 * @param url remote URL to download.
 * @param destination destination folder to extract the tar to.
 */
export async function downloadAndDecompressAsync(
  url: string,
  destination: string
): Promise<string> {
  const bar = new ProgressBar('[:bar] :percent :etas', {
    width: 64,
    total: 100,
    clear: true,
    complete: '=',
    incomplete: ' ',
  });
  // TODO: Auto track progress
  setProgressBar(bar);

  try {
    const response = await fetchAsync(url, {
      onProgress(progress) {
        if (bar) {
          bar.tick(1, progress);
        }
      },
    });
    if (!response.ok) {
      throw new CommandError(`Unexpected response: ${response.statusText}. From url: ${url}`);
    }

    await pipeline(response.body, tar.extract({ cwd: destination }));
    return destination;
  } finally {
    bar.terminate();
    setProgressBar(null);
  }
}
