import type { ConfigAPI } from '@babel/core';

import { getPossibleProjectRoot } from '../common';

let _prevPossibleProjectRoot: null | string = null;
let _cache: Record<string, string | null | undefined> = Object.create(null);

export function resolveModule(api: ConfigAPI, id: string): string | null {
  const possibleProjectRoot = api.caller(getPossibleProjectRoot) ?? process.cwd();
  if (possibleProjectRoot !== _prevPossibleProjectRoot) {
    _prevPossibleProjectRoot = possibleProjectRoot;
    _cache = Object.create(null);
  }

  let resolved = _cache[id];
  if (resolved !== undefined) {
    return resolved;
  }
  try {
    resolved = require.resolve(id, {
      paths: [possibleProjectRoot, __dirname],
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(id)) {
      resolved = null;
    } else {
      throw error;
    }
  } finally {
    _cache[id] = resolved;
  }
  return resolved;
}

export function hasModule(api: ConfigAPI, id: string): boolean {
  try {
    return resolveModule(api, id) != null;
  } catch {
    // We should always fail silently for a "hasModule" check
    return false;
  }
}
