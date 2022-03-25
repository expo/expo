import spawnAsync from '@expo/spawn-async';
import tar from 'tar';

import * as Log from '../log';

/** Extract a tar using built-in tools if available and falling back on Node.js. */
export async function extractAsync(input: string, output: string): Promise<void> {
  try {
    if (process.platform !== 'win32') {
      await spawnAsync('tar', ['-xf', input, '-C', output], {
        stdio: 'inherit',
      });
      return;
    }
  } catch (e) {
    Log.warn(
      `Failed to extract tar using native tools, falling back on JS tar module. ${e.message}`
    );
  }
  // tar node module has previously had problems with big files, and seems to
  // be slower, so only use it as a backup.
  await tar.extract({ file: input, cwd: output });
}
