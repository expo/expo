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
  // Add all nested imports...
  'assert/strict',
  'dns/promises',
  'inspector/promises',
  'fs/promises',
  'stream/web',
  'stream/promises',
  'path/posix',
  'path/win32',
  'readline/promises',
  'stream/consumers',
  'timers/promises',
  'util/types',
  // Collect all builtin modules...
  ...(
    builtinModules ||
    // @ts-expect-error
    (process.binding ? Object.keys(process.binding('natives')) : []) ||
    []
  ).filter((x) => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && !['sys'].includes(x)),
].sort();

const shimsFolder = path.join(require.resolve('@expo/cli/package.json'), '../static/shims');
const canaryFolder = path.join(require.resolve('@expo/cli/package.json'), '../static/canary');

export function shouldCreateVirtualShim(normalName: string) {
  const shimPath = path.join(shimsFolder, normalName);
  if (fs.existsSync(shimPath)) {
    return shimPath;
  }
  return null;
}
export function shouldCreateVirtualCanary(normalName: string): string | null {
  const canaryPath = path.join(canaryFolder, normalName);
  if (fs.existsSync(canaryPath)) {
    return canaryPath;
  }
  return null;
}

export function isNodeExternal(moduleName: string): string | null {
  const moduleId = moduleName.replace(/^node:/, '');
  if (NODE_STDLIB_MODULES.includes(moduleId)) {
    return moduleId;
  }
  return null;
}
