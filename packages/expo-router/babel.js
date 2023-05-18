const debug = require('debug')('expo:router:babel');
const { getConfig } = require('expo/config');
const nodePath = require('path');
const resolveFrom = require('resolve-from');

const { getExpoConstantsManifest } = require('./node/getExpoConstantsManifest');

function getExpoAppManifest(projectRoot) {
  if (process.env.APP_MANIFEST) {
    return process.env.APP_MANIFEST;
  }

  const exp = getExpoConstantsManifest(projectRoot);

  debug('public manifest', exp);

  return JSON.stringify(exp);
}

let config;

function getConfigMemo(projectRoot) {
  if (!config) {
    config = getConfig(projectRoot);
  }
  return config;
}

function getExpoRouterImportMode(projectRoot, platform) {
  if (process.env.EXPO_ROUTER_IMPORT_MODE) {
    return process.env.EXPO_ROUTER_IMPORT_MODE;
  }
  const env = process.env.NODE_ENV || process.env.BABEL_ENV;

  const { exp } = getConfigMemo(projectRoot);
  let mode = [env, true].includes(exp.extra?.router?.asyncRoutes) ? 'lazy' : 'sync';

  // TODO: Production bundle splitting

  if (env === 'production' && mode === 'lazy') {
    throw new Error(
      'Async routes are not supported in production yet. Set the `expo-router` Config Plugin prop `asyncRoutes` to `development`, `false`, or `undefined`.'
    );
  }

  // NOTE: This is a temporary workaround for static rendering on web.
  if (platform === 'web' && process.env.EXPO_USE_STATIC) {
    mode = 'sync';
  }

  // Development
  debug('Router import mode', mode);

  process.env.EXPO_ROUTER_IMPORT_MODE = mode;
  return mode;
}

function getExpoRouterAppRoot(projectRoot) {
  // Bump to v2 to prevent the CLI from setting the variable anymore.
  // TODO: Bump to v3 to revert back to the CLI setting the variable again, but with custom value
  // support.
  if (process.env.EXPO_ROUTER_APP_ROOT_2) {
    return process.env.EXPO_ROUTER_APP_ROOT_2;
  }
  const routerEntry = resolveFrom.silent(projectRoot, 'expo-router/entry');

  const { exp } = getConfigMemo(projectRoot);
  const customSrc = exp.extra?.router?.unstable_src || './app';
  const isAbsolute = customSrc.startsWith('/');
  // It doesn't matter if the app folder exists.
  const appFolder = isAbsolute ? customSrc : nodePath.join(projectRoot, customSrc);
  const appRoot = nodePath.relative(nodePath.dirname(routerEntry), appFolder);
  debug('routerEntry', routerEntry, appFolder, appRoot);

  process.env.EXPO_ROUTER_APP_ROOT_2 = appRoot;
  return appRoot;
}
// TODO: Strip the function `generateStaticParams` when bundling for node.js environments.

module.exports = function (api) {
  const { types: t } = api;
  const getRelPath = (state) => './' + nodePath.relative(state.file.opts.root, state.filename);

  const platform = api.caller((caller) => caller?.platform);
  return {
    name: 'expo-router',
    visitor: {
      // Add support for Node.js __filename
      Identifier(path, state) {
        if (path.node.name === '__filename') {
          path.replaceWith(
            t.stringLiteral(
              // `/index.js` is the value used by Webpack.
              getRelPath(state)
            )
          );
        }
        // Add support for Node.js `__dirname`.
        // This static value comes from Webpack somewhere.
        if (path.node.name === '__dirname') {
          path.replaceWith(t.stringLiteral('/'));
        }
      },

      // Convert `process.env.EXPO_ROUTER_APP_ROOT` to a string literal
      MemberExpression(path, state) {
        if (
          !t.isIdentifier(path.node.object, { name: 'process' }) ||
          !t.isIdentifier(path.node.property, { name: 'env' })
        ) {
          return;
        }

        const parent = path.parentPath;
        if (!t.isMemberExpression(parent.node)) {
          return;
        }

        const projectRoot = process.env.EXPO_PROJECT_ROOT || state.file.opts.root || '';

        // Used for log box and stuff
        if (
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_PROJECT_ROOT',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(projectRoot));
          return;
        }

        // Enable static rendering
        // TODO: Use a serializer or something to ensure this changes without
        // needing to clear the cache.
        if (
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_PUBLIC_USE_STATIC',
          }) &&
          !parent.parentPath.isAssignmentExpression() &&
          process.env.EXPO_PUBLIC_USE_STATIC
        ) {
          parent.replaceWith(t.stringLiteral(process.env.EXPO_PUBLIC_USE_STATIC));
          return;
        }

        // Surfaces the `app.json` (config) as an environment variable which is then parsed by
        // `expo-constants` https://docs.expo.dev/versions/latest/sdk/constants/
        if (
          t.isIdentifier(parent.node.property, {
            name: 'APP_MANIFEST',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          const manifest = getExpoAppManifest(projectRoot);
          parent.replaceWith(t.stringLiteral(manifest));
          return;
        }

        // Expose the app route import mode.
        if (
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_ROUTER_IMPORT_MODE',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(getExpoRouterImportMode(projectRoot, platform)));
          return;
        }

        if (
          !t.isIdentifier(parent.node.property, {
            name: 'EXPO_ROUTER_APP_ROOT',
          })
        ) {
          return;
        }

        if (parent.parentPath.isAssignmentExpression()) {
          return;
        }

        // Skip loading the app root in tests.
        // This is handled by the testing-library utils
        if (process.env.NODE_ENV === 'test') {
          return;
        }

        parent.replaceWith(
          // This is defined in Expo CLI when using Metro. It points to the relative path for the project app directory.
          t.stringLiteral(getExpoRouterAppRoot(projectRoot))
        );
      },
    },
  };
};
