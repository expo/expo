/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';

import { copyAsync } from '../../../utils/dir';

// A list of the Node.js standard library modules that are currently
// available,
export const NODE_STDLIB_MODULES: string[] = [
  'fs/promises',
  ...(
    builtinModules ||
    // @ts-expect-error
    (process.binding ? Object.keys(process.binding('natives')) : []) ||
    []
  ).filter((x) => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && !['sys'].includes(x)),
].sort();

export const EXTERNAL_REQUIRE_POLYFILL = '.expo/metro/polyfill.js';
export const EXTERNAL_REQUIRE_NATIVE_POLYFILL = '.expo/metro/polyfill.native.js';
export const METRO_SHIMS_FOLDER = '.expo/metro/shims';
export const REACT_CANARY_FOLDER = '.expo/metro/canary';

export async function setupShimFiles(
  projectRoot: string,
  { shims, canary }: { shims: boolean; canary: boolean }
) {
  await Promise.all(
    (
      [
        shims && [METRO_SHIMS_FOLDER, '../static/shims'],
        canary && [REACT_CANARY_FOLDER, '../static/canary'],
      ].filter(Boolean) as [string, string][]
    ).map(async ([folder, shimsId]) => {
      await fs.promises.mkdir(path.join(projectRoot, folder), { recursive: true });
      // Copy the shims to the project folder in case we're running in a monorepo.
      const shimsFolder = path.join(require.resolve('@expo/cli/package.json'), shimsId);

      await copyAsync(shimsFolder, path.join(projectRoot, folder), {
        overwrite: false,
        recursive: true,
      });
    })
  );
}

export function isNodeExternal(moduleName: string): string | null {
  const moduleId = moduleName.replace(/^node:/, '');
  if (NODE_STDLIB_MODULES.includes(moduleId)) {
    return moduleId;
  }
  return null;
}
