import { ConfigAPI, types } from '@babel/core';
import { getConfig, ProjectConfig } from 'expo/config';
import fs from 'fs';
import nodePath from 'path';
import resolveFrom from 'resolve-from';

import { getPlatform, getPossibleProjectRoot } from './common';

const debug = require('debug')('expo:babel:router');

let config: undefined | ProjectConfig;

function getConfigMemo(projectRoot: string) {
  if (!config || process.env._EXPO_INTERNAL_TESTING) {
    config = getConfig(projectRoot);
  }
  return config;
}

function getExpoRouterImportMode(projectRoot: string, platform: string): string {
  const envVar = 'EXPO_ROUTER_IMPORT_MODE_' + platform.toUpperCase();
  if (process.env[envVar]) {
    return process.env[envVar]!;
  }
  const env = process.env.NODE_ENV || process.env.BABEL_ENV;

  const { exp } = getConfigMemo(projectRoot);

  let asyncRoutesSetting;

  if (exp.extra?.router?.asyncRoutes) {
    const asyncRoutes = exp.extra?.router?.asyncRoutes;
    if (typeof asyncRoutes === 'string') {
      asyncRoutesSetting = asyncRoutes;
    } else if (typeof asyncRoutes === 'object') {
      asyncRoutesSetting = asyncRoutes[platform] ?? asyncRoutes.default;
    }
  }

  let mode = [env, true].includes(asyncRoutesSetting) ? 'lazy' : 'sync';

  // TODO: Production bundle splitting

  if (env === 'production' && mode === 'lazy') {
    throw new Error(
      'Async routes are not supported in production yet. Set the `expo-router` Config Plugin prop `asyncRoutes` to `development`, `false`, or `undefined`.'
    );
  }

  // NOTE: This is a temporary workaround for static rendering on web.
  if (platform === 'web' && (exp.web || {}).output === 'static') {
    mode = 'sync';
  }

  // Development
  debug('Router import mode', mode);

  process.env[envVar] = mode;
  return mode;
}

function directoryExistsSync(file: string) {
  return fs.statSync(file, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function getRouterDirectory(projectRoot: string) {
  // more specific directories first
  if (directoryExistsSync(nodePath.join(projectRoot, 'src/app'))) {
    // Log.log(chalk.gray('Using src/app as the root directory for Expo Router.'));
    return './src/app';
  }

  // Log.debug('Using app as the root directory for Expo Router.');
  return './app';
}

function getExpoRouterAppRoot(projectRoot: string) {
  // Bump to v2 to prevent the CLI from setting the variable anymore.
  // TODO: Bump to v3 to revert back to the CLI setting the variable again, but with custom value
  // support.
  if (process.env.EXPO_ROUTER_APP_ROOT_2) {
    return process.env.EXPO_ROUTER_APP_ROOT_2;
  }
  const routerEntry = resolveFrom(projectRoot, 'expo-router/entry');

  // It doesn't matter if the app folder exists.
  const appFolder = getExpoRouterAbsoluteAppRoot(projectRoot);
  const appRoot = nodePath.relative(nodePath.dirname(routerEntry), appFolder);
  debug('routerEntry', routerEntry, appFolder, appRoot);

  process.env.EXPO_ROUTER_APP_ROOT_2 = appRoot;

  return appRoot;
}

function getExpoRouterAbsoluteAppRoot(projectRoot: string) {
  if (process.env.EXPO_ROUTER_ABS_APP_ROOT) {
    return process.env.EXPO_ROUTER_ABS_APP_ROOT;
  }
  const { exp } = getConfigMemo(projectRoot);
  const customSrc = exp.extra?.router?.unstable_src || getRouterDirectory(projectRoot);
  const isAbsolute = customSrc.startsWith('/');
  // It doesn't matter if the app folder exists.
  const appFolder = isAbsolute ? customSrc : nodePath.join(projectRoot, customSrc);
  const appRoot = appFolder;
  debug('absolute router entry', appFolder, appRoot);

  process.env.EXPO_ROUTER_ABS_APP_ROOT = appFolder;
  return appRoot;
}
// TODO: Strip the function `generateStaticParams` when bundling for node.js environments.

/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_PUBLIC_USE_STATIC
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE_IOS
 * EXPO_ROUTER_IMPORT_MODE_ANDROID
 * EXPO_ROUTER_IMPORT_MODE_WEB
 */
export function expoRouterBabelPlugin(api: ConfigAPI & { types: typeof types }) {
  const { types: t } = api;

  const platform = api.caller(getPlatform);
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);
  return {
    name: 'expo-router',
    visitor: {
      // Convert `process.env.EXPO_ROUTER_APP_ROOT` to a string literal
      MemberExpression(path: any, state: any) {
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

        const projectRoot = possibleProjectRoot || state.file.opts.root || '';

        // Used for log box and stuff
        if (
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_PROJECT_ROOT',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(projectRoot));
        } else if (
          // Enable static rendering
          // TODO: Use a serializer or something to ensure this changes without
          // needing to clear the cache.
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_PUBLIC_USE_STATIC',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          if (platform === 'web') {
            const isStatic =
              process.env.EXPO_PUBLIC_USE_STATIC === 'true' ||
              process.env.EXPO_PUBLIC_USE_STATIC === '1';
            parent.replaceWith(t.booleanLiteral(isStatic));
          } else {
            parent.replaceWith(t.booleanLiteral(false));
          }
        } else if (
          process.env.NODE_ENV !== 'test' &&
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_ROUTER_ABS_APP_ROOT',
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(getExpoRouterAbsoluteAppRoot(projectRoot)));
        } else if (
          // Skip loading the app root in tests.
          // This is handled by the testing-library utils
          process.env.NODE_ENV !== 'test' &&
          t.isIdentifier(parent.node.property, {
            name: 'EXPO_ROUTER_APP_ROOT',
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
            name: 'EXPO_ROUTER_IMPORT_MODE_' + platform.toUpperCase(),
          }) &&
          !parent.parentPath.isAssignmentExpression()
        ) {
          parent.replaceWith(t.stringLiteral(getExpoRouterImportMode(projectRoot, platform)));
        }
      },
    },
  };
}
