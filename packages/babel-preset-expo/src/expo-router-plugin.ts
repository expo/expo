import { ConfigAPI, NodePath, types } from '@babel/core';
import nodePath from 'path';
import resolveFrom from 'resolve-from';

import {
  getAsyncRoutes,
  getExpoRouterAbsoluteAppRoot,
  getPlatform,
  getPossibleProjectRoot,
} from './common';

const debug = require('debug')('expo:babel:router');

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
 * EXPO_ROUTER_IMPORT_MODE
 */
export function expoRouterBabelPlugin(api: ConfigAPI & { types: typeof types }) {
  const { types: t } = api;
  const platform = api.caller(getPlatform);
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);
  const asyncRoutes = api.caller(getAsyncRoutes);
  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);

  function isFirstInAssign(path: NodePath<types.MemberExpression>) {
    return types.isAssignmentExpression(path.parent) && path.parent.left === path.node;
  }

  return {
    name: 'expo-router',
    visitor: {
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
            } else if (key.value.startsWith('EXPO_ROUTER_IMPORT_MODE')) {
              path.replaceWith(t.stringLiteral(asyncRoutes ? 'lazy' : 'sync'));
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
      },
    },
  };
}
