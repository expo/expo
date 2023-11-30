import { ConfigAPI, NodePath, types } from '@babel/core';
import { getConfig, ProjectConfig } from 'expo/config';
import nodePath from 'path';
import resolveFrom from 'resolve-from';

import { getExpoRouterAbsoluteAppRoot, getPlatform, getPossibleProjectRoot } from './common';

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

function getExpoRouterAppRoot(projectRoot: string, appFolder: string) {
  // TODO: We should have cache invalidation if the expo-router/entry file location changes.
  const routerEntry = resolveFrom(projectRoot, 'expo-router/entry');

  const appRoot = nodePath.relative(nodePath.dirname(routerEntry), appFolder);

  debug('routerEntry', routerEntry, appFolder, appRoot);
  return appRoot;
}

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
  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);

  function isFirstInAssign(path: NodePath<types.MemberExpression>) {
    return types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
  }

  return {
    name: 'expo-router',
    visitor: {
      // Convert `process.env.EXPO_ROUTER_APP_ROOT` to a string literal
      MemberExpression(path: any, state: any) {
        const projectRoot = possibleProjectRoot || state.file.opts.root || '';

        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey();
          if (t.isStringLiteral(key) && !isFirstInAssign(path)) {
            // Used for log box on web.
            if (key.value.startsWith('EXPO_PROJECT_ROOT')) {
              path.replaceWith(t.stringLiteral(projectRoot));
            } else if (
              // TODO: Add cache invalidation.
              key.value.startsWith('EXPO_PUBLIC_USE_STATIC')
            ) {
              if (platform === 'web') {
                const isStatic =
                  process.env.EXPO_PUBLIC_USE_STATIC === 'true' ||
                  process.env.EXPO_PUBLIC_USE_STATIC === '1';
                path.replaceWith(t.booleanLiteral(isStatic));
              } else {
                path.replaceWith(t.booleanLiteral(false));
              }
            }

            if (
              // Skip loading the app root in tests.
              // This is handled by the testing-library utils
              process.env.NODE_ENV !== 'test'
            ) {
              if (key.value.startsWith('EXPO_ROUTER_ABS_APP_ROOT')) {
                path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
              } else if (key.value.startsWith('EXPO_ROUTER_APP_ROOT')) {
                path.replaceWith(
                  t.stringLiteral(getExpoRouterAppRoot(possibleProjectRoot, routerAbsoluteRoot))
                );
              }
            }
          }
        }

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

        if (
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
