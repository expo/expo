import picomatch from 'picomatch';

const debug = require('debug')('expo:file-transform') as typeof console.log;

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
