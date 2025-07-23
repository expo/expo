const path = require('path');
const canariesDir = path.join(require.resolve('@expo/cli/package.json'), '../static/canary-full');

/** @type {import('jest-resolve').SyncResolver} */
function customResolver(request, options) {
  // TODO: Remove this when we have React 19 in the expo/expo monorepo.
  if (
    // Change the node modules path for react and react-dom to use the vendor in Expo CLI.
    /^(react|react\/.*|react-dom|react-dom\/.*)$/.test(request)
  ) {
    options.basedir = canariesDir;
  }

  // Fall back to Jest's default resolver
  return options.defaultResolver(request, options);
}

module.exports = customResolver;
