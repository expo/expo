const { getConfig } = require("expo/config");
const fs = require("fs");
const nodePath = require("path");
const resolveFrom = require("resolve-from");

const { getExpoConstantsManifest } = require("./node/getExpoConstantsManifest");

const debug = require("debug")("expo:router:babel");

function getExpoAppManifest(projectRoot) {
  if (process.env.APP_MANIFEST) {
    return process.env.APP_MANIFEST;
  }

  const exp = getExpoConstantsManifest(projectRoot);

  debug("public manifest", exp);

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
  const envVar = "EXPO_ROUTER_IMPORT_MODE_" + platform.toUpperCase();
  if (process.env[envVar]) {
    return process.env[envVar];
  }
  const env = process.env.NODE_ENV || process.env.BABEL_ENV;

  const { exp } = getConfigMemo(projectRoot);

  let asyncRoutesSetting;

  if (exp.extra?.router?.asyncRoutes) {
    const asyncRoutes = exp.extra?.router?.asyncRoutes;
    if (typeof asyncRoutes === "string") {
      asyncRoutesSetting = asyncRoutes;
    } else if (typeof asyncRoutes === "object") {
      asyncRoutesSetting = asyncRoutes[platform] ?? asyncRoutes.default;
    }
  }

  let mode = [env, true].includes(asyncRoutesSetting) ? "lazy" : "sync";

  // TODO: Production bundle splitting

  if (env === "production" && mode === "lazy") {
    throw new Error(
      "Async routes are not supported in production yet. Set the `expo-router` Config Plugin prop `asyncRoutes` to `development`, `false`, or `undefined`."
    );
  }

  // NOTE: This is a temporary workaround for static rendering on web.
  if (platform === "web" && (exp.web || {}).output === "static") {
    mode = "sync";
  }

  // Development
  debug("Router import mode", mode);

  process.env[envVar] = mode;
  return mode;
}

function directoryExistsSync(file) {
  return fs.statSync(file, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function getRouterDirectory(projectRoot) {
  // more specific directories first
  if (directoryExistsSync(nodePath.join(projectRoot, "src/app"))) {
    // Log.log(chalk.gray('Using src/app as the root directory for Expo Router.'));
    return "./src/app";
  }

  // Log.debug('Using app as the root directory for Expo Router.');
  return "./app";
}

function getExpoRouterAppRoot(projectRoot) {
  // Bump to v2 to prevent the CLI from setting the variable anymore.
  // TODO: Bump to v3 to revert back to the CLI setting the variable again, but with custom value
  // support.
  if (process.env.EXPO_ROUTER_APP_ROOT_2) {
    return process.env.EXPO_ROUTER_APP_ROOT_2;
  }
  const routerEntry = resolveFrom.silent(projectRoot, "expo-router/entry");

  // It doesn't matter if the app folder exists.
  const appFolder = getExpoRouterAbsoluteAppRoot(projectRoot);
  const appRoot = nodePath.relative(nodePath.dirname(routerEntry), appFolder);
  debug("routerEntry", routerEntry, appFolder, appRoot);

  process.env.EXPO_ROUTER_APP_ROOT_2 = appRoot;
  return appRoot;
}

function getExpoRouterAbsoluteAppRoot(projectRoot) {
  if (process.env.EXPO_ROUTER_ABS_APP_ROOT) {
    return process.env.EXPO_ROUTER_ABS_APP_ROOT;
  }
  const { exp } = getConfigMemo(projectRoot);
  const customSrc =
    exp.extra?.router?.unstable_src || getRouterDirectory(projectRoot);
  const isAbsolute = customSrc.startsWith("/");
  // It doesn't matter if the app folder exists.
  const appFolder = isAbsolute
    ? customSrc
    : nodePath.join(projectRoot, customSrc);
  const appRoot = appFolder;
  debug("absolute router entry", appFolder, appRoot);

  process.env.EXPO_ROUTER_ABS_APP_ROOT = appFolder;
  return appRoot;
}
// TODO: Strip the function `generateStaticParams` when bundling for node.js environments.

module.exports = function (api) {
  const { types: t } = api;
  const getRelPath = (state) =>
    "./" + nodePath.relative(state.file.opts.root, state.filename);

  const platform = api.caller((caller) => caller?.platform);
  return {
    name: "expo-router",
    visitor: {
      // Add support for Node.js __filename
      Identifier(path, state) {
        if (path.node.name === "__filename") {
          path.replaceWith(
            t.stringLiteral(
              // `/index.js` is the value used by Webpack.
              getRelPath(state)
            )
          );
        }
        // Add support for Node.js `__dirname`.
        // This static value comes from Webpack somewhere.
        if (path.node.name === "__dirname") {
          path.replaceWith(t.stringLiteral("/"));
        }
      },

      // Convert `process.env.EXPO_ROUTER_APP_ROOT` to a string literal
      MemberExpression(path, state) {
        if (
          !t.isIdentifier(path.node.object, { name: "process" }) ||
          !t.isIdentifier(path.node.property, { name: "env" })
        ) {
          return;
        }

        const parent = path.parentPath;
        if (!t.isMemberExpression(parent.node)) {
          return;
        }

        const projectRoot =
          process.env.EXPO_PROJECT_ROOT || state.file.opts.root || "";

        // Used for log box and stuff
        if (
          t.isIdentifier(parent.node.property, {
            name: "EXPO_PROJECT_ROOT",
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(projectRoot));
        } else if (
          // Enable static rendering
          // TODO: Use a serializer or something to ensure this changes without
          // needing to clear the cache.
          t.isIdentifier(parent.node.property, {
            name: "EXPO_PUBLIC_USE_STATIC",
          }) &&
          !parent.parentPath.isAssignmentExpression() &&
          process.env.EXPO_PUBLIC_USE_STATIC
        ) {
          parent.replaceWith(
            t.stringLiteral(process.env.EXPO_PUBLIC_USE_STATIC)
          );
        } else if (
          // Surfaces the `app.json` (config) as an environment variable which is then parsed by
          // `expo-constants` https://docs.expo.dev/versions/latest/sdk/constants/
          t.isIdentifier(parent.node.property, {
            name: "APP_MANIFEST",
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          const manifest = getExpoAppManifest(projectRoot);
          parent.replaceWith(t.stringLiteral(manifest));
        } else if (
          process.env.NODE_ENV !== "test" &&
          t.isIdentifier(parent.node.property, {
            name: "EXPO_ROUTER_ABS_APP_ROOT",
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(
            t.stringLiteral(getExpoRouterAbsoluteAppRoot(projectRoot))
          );
        } else if (
          // Skip loading the app root in tests.
          // This is handled by the testing-library utils
          process.env.NODE_ENV !== "test" &&
          t.isIdentifier(parent.node.property, {
            name: "EXPO_ROUTER_APP_ROOT",
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(
            // This is defined in Expo CLI when using Metro. It points to the relative path for the project app directory.
            t.stringLiteral(getExpoRouterAppRoot(projectRoot))
          );
        } else if (
          // Expose the app route import mode.
          platform &&
          t.isIdentifier(parent.node.property, {
            name: "EXPO_ROUTER_IMPORT_MODE_" + platform.toUpperCase(),
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(
            t.stringLiteral(getExpoRouterImportMode(projectRoot, platform))
          );
        }
      },
    },
  };
};
