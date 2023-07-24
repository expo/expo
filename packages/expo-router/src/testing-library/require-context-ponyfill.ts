import fs from 'fs';
import path from 'path';

import { RequireContext } from '../types';

export default function requireContext(
  base = '.',
  scanSubDirectories = true,
  regularExpression = /\.[tj]sx?$/
) {
  const files: Record<string, unknown> = {};

  function readDirectory(directory: string) {
    fs.readdirSync(directory).forEach((file: string) => {
      const fullPath = path.resolve(directory, file);
      const relativePath = `./${path.relative(base, fullPath)}`;

      if (fs.statSync(fullPath).isDirectory()) {
        if (scanSubDirectories) readDirectory(fullPath);

        return;
      }

      if (!regularExpression.test(fullPath)) return;

      files[relativePath] = true;
    });
  }

  readDirectory(base);

  const context: RequireContext = Object.assign(
    function Module(file: string) {
      return require(path.join(base, file));
    },
    {
      keys: () => Object.keys(files),
      resolve: (key: string) => key,
      id: '0',
    }
  );

  return context;
}
