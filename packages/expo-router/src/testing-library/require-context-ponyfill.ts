// @ts-ignore: types node
import fs from 'node:fs';
// @ts-ignore: types node
import path from 'node:path';

import type { RequireContext } from '../types';

interface RequireContextPonyFill extends RequireContext {
  __add(file: string): void;
  __delete(file: string): void;
}

export default function requireContext(
  base = '.',
  scanSubDirectories = true,
  regularExpression = /\.[tj]sx?$/
) {
  const files: Record<string, unknown> = {};

  function readDirectory(directory: string) {
    fs.readdirSync(directory).forEach((file: string) => {
      const fullPath = path.resolve(directory, file);
      const relativePath = `./${path.relative(base, fullPath).split(path.sep).join('/')}`;

      if (fs.statSync(fullPath).isDirectory()) {
        if (scanSubDirectories) readDirectory(fullPath);

        return;
      }

      if (!regularExpression.test(relativePath)) return;

      files[relativePath] = true;
    });
  }

  readDirectory(base);

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
