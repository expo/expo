/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';

// TODO(@kitten): When `builtinModules` isn't present, we instead use the `process.binding('natives')` internal
// call which is almost equivalent. It's unclear from the History in Node.js' docs whether this fallback is still necessary
// https://nodejs.org/api/module.html#modulebuiltinmodules
declare global {
  namespace NodeJS {
    interface Process {
      binding?(key: 'natives'): Record<string, unknown>;
    }
  }
}

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
  'sqlite',

  // Collect all builtin modules...
  ...(
    builtinModules ||
    (process.binding ? Object.keys(process.binding('natives')) : []) ||
    []
  ).filter((x) => !/^(internal|v8|node-inspect)\/|\//.test(x) && !['sys'].includes(x)),
].sort();

const shimsFolder = path.join(require.resolve('@expo/cli/package.json'), '../static/shims');

export function shouldCreateVirtualShim(normalName: string) {
  const shimPath = path.join(shimsFolder, normalName);
  if (fs.existsSync(shimPath)) {
    return shimPath;
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
