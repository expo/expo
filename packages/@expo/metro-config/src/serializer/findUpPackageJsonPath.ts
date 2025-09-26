/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

export const findUpPackageJsonPath = (root: string): string => {
  for (let dir = root; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (fs.existsSync(file)) {
      return file;
    }
  }
  throw new Error(`Cannot find package.json from "${root}"`);
};
