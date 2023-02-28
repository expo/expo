import { Resolution } from 'metro-resolver';
import path from 'path';

import { matchTsConfigPathAlias } from './matchTsConfigPathAlias';

type Paths = { [match: string]: string[] };

const debug = require('debug')('expo:metro:tsconfig-paths') as typeof console.log;

const isAbsolute = process.platform === 'win32' ? path.win32.isAbsolute : path.posix.isAbsolute;

export function resolveWithTsConfigPaths(
  config: { paths: Paths; baseUrl: string },
  request: {
    /** Import request */
    moduleName: string;
    /** Originating file path */
    originModulePath: string;
  },
  resolve: (moduleName: string) => Resolution | null
): Resolution | null {
  const aliases = Object.keys(config.paths);

  if (
    // If no aliases are added bail out
    !aliases.length ||
    // Library authors cannot utilize this feature in userspace.
    /node_modules/.test(request.originModulePath) ||
    // Absolute paths are not supported
    isAbsolute(request.moduleName) ||
    // Relative paths are not supported
    /^\.\.?($|[\\/])/.test(request.moduleName)
  ) {
    return null;
  }

  const matched = matchTsConfigPathAlias(aliases, request.moduleName);
  if (!matched) {
    return null;
  }

  for (const alias of config.paths[matched.text]) {
    const nextModuleName = matched.star ? alias.replace('*', matched.star) : alias;

    if (/\.d\.ts$/.test(nextModuleName)) continue;

    const possibleResult = path.join(config.baseUrl, nextModuleName);

    const result = resolve(possibleResult);
    if (result) {
      debug(`${request.moduleName} -> ${possibleResult}`);
      return result;
    }
  }
  return null;
}
