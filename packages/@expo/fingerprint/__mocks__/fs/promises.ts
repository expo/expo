import { fs } from 'memfs';
import path from 'path';

/**
 * Further mock `fs.promises` to ensure the parent directory exists.
 * We used to call `fs.promises.mkdtemp(path.join(os.tmpdir(), ...))`, so that we don't have to worry about os.tmpdir() exists.
 */
const origMkdtemp = fs.promises.mkdtemp;
fs.promises.mkdtemp = (
  prefix: string,
  options?: Parameters<typeof origMkdtemp>[1]
): ReturnType<typeof origMkdtemp> => {
  fs.mkdirSync(path.dirname(prefix), { recursive: true });
  return origMkdtemp(prefix, options);
};

module.exports = fs.promises;
