import spawnAsync from '@expo/spawn-async';
import tar from 'tar';

import * as Log from '../log';

const debug = require('debug')('expo:utils:tar') as typeof console.log;

/** Extract a tar using built-in tools if available and falling back on Node.js. */
export async function extractAsync(input: string, output: string): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      debug(`Extracting ${input} to ${output}`);
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
  debug(`Extracting ${input} to ${output} using JS tar module`);
  // tar node module has previously had problems with big files, and seems to
  // be slower, so only use it as a backup.
  await tar.extract({ file: input, cwd: output });
}
