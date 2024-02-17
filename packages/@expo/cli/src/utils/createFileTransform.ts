import { IOSConfig } from '@expo/config-plugins';
import path from 'path';
import picomatch from 'picomatch';
import { ReadEntry } from 'tar';

const debug = require('debug')('expo:file-transform') as typeof console.log;

export function createEntryResolver(name: string) {
  return (entry: ReadEntry) => {
    if (name) {
      // Rewrite paths for bare workflow
      entry.path = entry.path
        .replace(
          /HelloWorld/g,
          entry.path.includes('android')
            ? IOSConfig.XcodeUtils.sanitizedName(name.toLowerCase())
            : IOSConfig.XcodeUtils.sanitizedName(name)
        )
        .replace(/helloworld/g, IOSConfig.XcodeUtils.sanitizedName(name).toLowerCase());
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

  debug(
    'filter: created for pattern(s) "%s" (%s)',
    Array.isArray(globPattern) ? globPattern.join('", "') : globPattern,
    options
  );

  return (path: string) => {
    const included = matcher(path);
    debug('filter: %s - %s', included ? 'include' : 'exclude', path);
    return included;
  };
}
