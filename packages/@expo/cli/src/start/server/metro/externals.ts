/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';

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
export const METRO_EXTERNALS_FOLDER = '.expo/metro/externals';

export function getNodeExternalModuleId(fromModule: string, moduleId: string) {
  return path.relative(
    path.dirname(fromModule),
    path.join(METRO_EXTERNALS_FOLDER, moduleId, 'index.js')
  );
}

export async function setupNodeExternals(projectRoot: string) {
  await tapExternalRequirePolyfill(projectRoot);
  await tapNodeShims(projectRoot);
}

async function tapExternalRequirePolyfill(projectRoot: string) {
  await fs.promises.mkdir(path.join(projectRoot, path.dirname(EXTERNAL_REQUIRE_POLYFILL)), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(projectRoot, EXTERNAL_REQUIRE_POLYFILL),
    'global.$$require_external = typeof window === "undefined" ? require : () => null;'
  );
  await fs.promises.writeFile(
    path.join(projectRoot, EXTERNAL_REQUIRE_NATIVE_POLYFILL),
    'global.$$require_external = (moduleId) => {throw new Error(`Node.js standard library module ${moduleId} is not available in this JavaScript environment`);}'
  );
}

export function isNodeExternal(moduleName: string): string | null {
  const moduleId = moduleName.replace(/^node:/, '');
  if (NODE_STDLIB_MODULES.includes(moduleId)) {
    return moduleId;
  }
  return null;
}

function tapNodeShimContents(moduleId: string): string {
  return `module.exports = $$require_external('node:${moduleId}');`;
}

// Ensure Node.js shims which require using `$$require_external` are available inside the project.
async function tapNodeShims(projectRoot: string) {
  const externals: Record<string, string> = {};
  for (const moduleId of NODE_STDLIB_MODULES) {
    const shimDir = path.join(projectRoot, METRO_EXTERNALS_FOLDER, moduleId);
    const shimPath = path.join(shimDir, 'index.js');
    externals[moduleId] = shimPath;

    if (!fs.existsSync(shimPath)) {
      await fs.promises.mkdir(shimDir, { recursive: true });
      await fs.promises.writeFile(shimPath, tapNodeShimContents(moduleId));
    }
  }
}
