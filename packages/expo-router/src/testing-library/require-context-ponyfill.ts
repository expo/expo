// @ts-ignore: types node
import fs from 'node:fs';
// @ts-ignore: types node
import path from 'node:path';

import type { RequireContext } from '../types';
import type { FileContextKey } from '../types/paths';

export interface RequireContextPonyFill extends RequireContext {
  __add(file: FileContextKey): void;
  __delete(file: FileContextKey): void;
}

export default function requireContext(
  base = '.',
  scanSubDirectories = true,
  regularExpression = /\.[tj]sx?$/,
  files: Partial<Record<FileContextKey, unknown>> = {}
) {
  const baseTarget = path.resolve(base);

  function readDirectory(directory: string = '') {
    const target = path.resolve(baseTarget, directory);
    const entries = fs.readdirSync(target, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = directory ? path.join(directory, entry.name) : entry.name;
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          continue;
        } else if (scanSubDirectories) {
          readDirectory(relativePath);
        }
      } else if (entry.isFile()) {
        const posixPath: FileContextKey = `./${relativePath.split(path.sep).join('/')}`;
        if (regularExpression.test(posixPath)) {
          files[posixPath] = true;
        }
      }
    }
  }

  if (fs.existsSync(baseTarget)) {
    readDirectory();
  }

  const context: RequireContextPonyFill = Object.assign(
    function Module(file: string) {
      return require(path.join(base, file));
    },
    {
      // Object.keys() widens the keys of the FileContextKey-indexed file map.
      keys: () => Object.keys(files) as FileContextKey[],
      resolve: (key: string) => key,
      id: '0',
      __add(file: FileContextKey) {
        files[file] = true;
      },
      __delete(file: FileContextKey) {
        delete files[file];
      },
    }
  );

  return context;
}
