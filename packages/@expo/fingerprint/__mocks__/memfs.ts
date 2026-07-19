const memfs = jest.requireActual('memfs');
const path = require('path');

/**
 * Further mock memfs `fs.promises` to ensure the parent directory exists.
 * We used to call `fs.promises.mkdtemp(path.join(os.tmpdir(), ...))`, so that we don't have to worry about os.tmpdir() exists.
 */
const origMkdtemp = memfs.fs.promises.mkdtemp;
memfs.fs.promises.mkdtemp = (
  prefix: string,
  options?: Parameters<typeof origMkdtemp>[1]
): ReturnType<typeof origMkdtemp> => {
  memfs.fs.mkdirSync(path.dirname(prefix), { recursive: true });
  return origMkdtemp(prefix, options);
};

module.exports = memfs;
