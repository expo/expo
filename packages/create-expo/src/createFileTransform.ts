import path from 'path';
import picomatch from 'picomatch';
import { type ReadEntry } from 'tar';

const debug = require('debug')('expo:init:fileTransform') as typeof console.log;

export function sanitizedName(name: string) {
  return name
    .replace(/[\W_]+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function createEntryResolver(name: string) {
  return (entry: ReadEntry) => {
    if (name) {
      // Rewrite paths for bare workflow
      entry.path = entry.path
        .replace(
          /HelloWorld/g,
          entry.path.includes('android') ? sanitizedName(name.toLowerCase()) : sanitizedName(name)
        )
        .replace(/helloworld/g, sanitizedName(name).toLowerCase());
    }
    if (entry.type && /^file$/i.test(entry.type) && path.basename(entry.path) === 'gitignore') {
      // Rename `gitignore` because npm ignores files named `.gitignore` when publishing.
      // See: https://github.com/npm/npm/issues/1862
      entry.path = entry.path.replace(/gitignore$/, '.gitignore');
    }
  };
}

export function createGlobFilter(
  globPattern: picomatch.Glob,
  options?: picomatch.PicomatchOptions
) {
  const matcher = picomatch(globPattern, options);

  debug('filter: created for pattern %s (%s)', globPattern);

  return (path: string) => {
    const included = matcher(path);
    debug('filter: %s - %s', included ? 'include' : 'exclude', path);
    return included;
  };
}
