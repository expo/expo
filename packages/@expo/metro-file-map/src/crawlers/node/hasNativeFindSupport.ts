/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from 'child_process';

export default async function hasNativeFindSupport(): Promise<boolean> {
  try {
    return await new Promise((resolve) => {
      // Check the find binary supports the non-POSIX -iname parameter wrapped in parens.
      const args = ['.', '-type', 'f', '(', '-iname', '*.ts', '-o', '-iname', '*.js', ')'];
      const child = spawn('find', args, { cwd: __dirname });
      child.on('error', () => {
        resolve(false);
      });
      child.on('exit', (code) => {
        resolve(code === 0);
      });
    });
  } catch {
    return false;
  }
}
