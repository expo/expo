// @ts-ignore: types node
import fs from 'node:fs';
// @ts-ignore: types node
import path from 'node:path';

import type { RequireContext } from '../types';

export interface RequireContextPonyFill extends RequireContext {
  __add(file: string): void;
  __delete(file: string): void;
}

export default function requireContext(
  base = '.',
  scanSubDirectories = true,
  regularExpression = /\.[tj]sx?$/,
  files: Record<string, unknown> = {}
) {
  function readDirectory(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(directory, entry.name);
      const relativePath = `./${path.relative(base, fullPath).split(path.sep).join('/')}`;

      if (entry.isDirectory()) {
        if (scanSubDirectories) readDirectory(fullPath);
        continue;
      }

      if (!regularExpression.test(relativePath)) continue;

      files[relativePath] = true;
    }
  }

  if (fs.existsSync(base)) {
    readDirectory(base);
  }

  const context: RequireContextPonyFill = Object.assign(
    function Module(file: string) {
      return require(path.join(base, file));
    },
    {
      keys: () => Object.keys(files),
      resolve: (key: string) => key,
      id: '0',
      __add(file: string) {
        files[file] = true;
      },
      __delete(file: string) {
        delete files[file];
      },
    }
  );

  return context;
}
