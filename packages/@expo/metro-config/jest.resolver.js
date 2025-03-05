// NOTE(cedric): This resolver is a workaround for a bug in `resolve.exports` that `jest-resolve` uses.
// A file named equal to it's extension, and exposed through `exports`, can't be resolved by `resolve.exports`.
// See: https://github.com/lukeed/resolve.exports/issues/40
// Once a patch has been released for this bug, we can safely drop this custom resolver.

const path = require('node:path');

/** @type {import('jest-resolve').JestResolver['sync']} */
module.exports = (moduleImport, options) => {
  // See: https://github.com/lukeed/resolve.exports/issues/40
  if (!moduleImport.startsWith('.') && path.basename(moduleImport) === 'js') {
    return require.resolve(moduleImport, { paths: [options.basedir] });
  }

  return options.defaultResolver(moduleImport, options);
};
