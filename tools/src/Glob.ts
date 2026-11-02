import { globSync as fsGlobSync } from 'node:fs';
import { glob as fsGlob } from 'node:fs/promises';
import path from 'node:path';
import { glob as tinyGlob, globSync as tinyGlobSync } from 'tinyglobby';

export interface GlobOptions {
  cwd?: string;
  absolute?: boolean;
  ignore?: string | readonly string[];
  onlyFiles?: boolean;
  followSymbolicLinks?: boolean;
}

function tinyOptions(options: GlobOptions) {
  return {
    onlyFiles: false,
    expandDirectories: false,
    caseSensitiveMatch: process.platform !== 'darwin' && process.platform !== 'win32',
    ...options,
    ignore: options.ignore ? [options.ignore].flat() : undefined,
  };
}

function resolveMatches(matches: string[], options: GlobOptions) {
  return options.absolute ? matches.map((file) => path.resolve(options.cwd ?? '.', file)) : matches;
}

export async function glob(
  patterns: string | string[],
  options: GlobOptions = {}
): Promise<string[]> {
  // NOTE(@kitten): Node's string excludes receive basenames; tinyglobby also avoids per-file stats.
  if (options.ignore?.length || options.onlyFiles || options.followSymbolicLinks === false)
    return tinyGlob(patterns, tinyOptions(options));
  return resolveMatches(await Array.fromAsync(fsGlob(patterns, { cwd: options.cwd })), options);
}

export function globSync(patterns: string | string[], options: GlobOptions = {}): string[] {
  if (options.ignore?.length || options.onlyFiles || options.followSymbolicLinks === false)
    return tinyGlobSync(patterns, tinyOptions(options));
  return resolveMatches(fsGlobSync(patterns, { cwd: options.cwd }), options);
}
