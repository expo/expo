import os from 'node:os';
import * as tempdir from 'temp-dir';

// This is a workaround for the `fs.realpathSync` invocation from `temp-dir`,
// used by `@expo/image-utils/src/Download.ts` -> `temp-dir`.
globalThis[Symbol.for('__RESOLVED_TEMP_DIRECTORY__')] = os.tmpdir();

module.exports = tempdir;
