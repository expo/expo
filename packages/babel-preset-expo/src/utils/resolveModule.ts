import type { ConfigAPI } from '@babel/core';

import { getPossibleProjectRoot } from '../common';

export function resolveModule(api: ConfigAPI, id: string): string | null {
  const possibleProjectRoot = api.caller(getPossibleProjectRoot) ?? process.cwd();
  try {
    return require.resolve(id, {
      paths: [possibleProjectRoot, __dirname],
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(id)) {
      return null;
    }
    throw error;
  }
}

export function hasModule(api: ConfigAPI, id: string): boolean {
  try {
    return resolveModule(api, id) != null;
  } catch {
    // We should always fail silently for a "hasModule" check
    return false;
  }
}
