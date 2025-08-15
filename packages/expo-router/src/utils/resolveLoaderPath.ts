/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';

export interface LoaderResolutionOptions {
  isExporting?: boolean;
  projectRoot?: string;
  routerRoot?: string;
}

/**
 * Resolves a loader's module path.
 *
 * In development mode: Returns a Metro-compatible relative path
 * In export mode: Returns an absolute filesystem path
 *
 */
export function resolveLoaderModulePath(
  contextKey: string,
  options: LoaderResolutionOptions
): string {
  let modulePath = contextKey.replace(/\.(js|ts)x?$/, '');

  // When exporting, we need an absolute filesystem path for Node.js to `require()`
  if (options.isExporting && options.projectRoot && options.routerRoot) {
    if (modulePath.startsWith('./')) {
      const fileName = modulePath.replace('./', '');
      const appDir = path.join(options.projectRoot, options.routerRoot);
      modulePath = path.resolve(appDir, fileName);
    } else if (!path.isAbsolute(modulePath)) {
      const appDir = path.join(options.projectRoot, options.routerRoot);
      modulePath = path.resolve(appDir, modulePath);
    }
  }

  return modulePath;
}
