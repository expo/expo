/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

export const findUpPackageJsonPath = (dir: string): string => {
  if (dir === path.sep) {
    // All files should have `package.json`.
    throw new Error(`Cannot find package.json from ${dir}`);
  }
  const packageJsonPath = path.join(dir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return packageJsonPath;
  }
  return findUpPackageJsonPath(path.dirname(dir));
};
