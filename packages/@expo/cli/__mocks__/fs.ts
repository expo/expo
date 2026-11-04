import { fs } from 'memfs';
import path from 'node:path';
import { globSync } from 'tinyglobby';

const mockFs = Object.assign(fs, {
  globSync(
    pattern: string | string[],
    options: { cwd?: string; exclude?: (entry: string) => boolean } = {}
  ) {
    return globSync(pattern, {
      cwd: options.cwd,
      absolute: typeof pattern === 'string' && path.isAbsolute(pattern),
      onlyFiles: false,
      expandDirectories: false,
      fs,
    })
      .map((file) => file.replace(/\/$/, ''))
      .filter((file) => !options.exclude?.(file));
  },
});
Object.assign(fs.promises, {
  async *glob(...args: Parameters<typeof mockFs.globSync>) {
    yield* mockFs.globSync(...args);
  },
});
module.exports = mockFs;
