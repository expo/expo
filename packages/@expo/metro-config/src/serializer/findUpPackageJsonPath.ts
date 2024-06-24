/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import path from 'path';

export const findUpPackageJsonPath = (projectRoot: string, dir: string): string | null => {
  if (dir === path.sep || dir.length < projectRoot.length) {
    return null;
  }
  const packageJsonPath = path.join(dir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    return packageJsonPath;
  }
  return findUpPackageJsonPath(projectRoot, path.dirname(dir));
};
