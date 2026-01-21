/**
 * Copyright © 2024 650 Industries.
 */
import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
import nodePath from 'node:path';

import { getExpoRouterAbsoluteAppRoot, getPossibleProjectRoot, getAsyncRoutes } from './common';

const debug = require('debug')('expo:babel:router');

/**
 * Compute the relative path from the current file to the app folder.
 *
 * Previously this was computed relative to `expo-router/entry`, but that breaks
 * when packages are hoisted to unexpected locations (e.g., with Bun in monorepos).
 * By using the actual file being transformed, the relative path is always correct
 * regardless of where the package is installed.
 */
function getExpoRouterAppRoot(currentFile: string, appFolder: string) {
  const appRoot = nodePath.relative(nodePath.dirname(currentFile), appFolder);
  debug('getExpoRouterAppRoot', currentFile, appFolder, appRoot);
  return appRoot;
}

interface ExpoRouterPluginState extends PluginPass {
  projectRoot?: string;
  isTestEnv?: boolean;
}

/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
export function expoRouterBabelPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);
  const asyncRoutes = api.caller(getAsyncRoutes);
  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);
  const importMode = asyncRoutes ? 'lazy' : 'sync';

  return {
    name: 'expo-router',

    pre() {
      const state = this as ExpoRouterPluginState;
      state.projectRoot = possibleProjectRoot || this.file.opts.root || '';
      // Check test env at transform time, not module load time
      state.isTestEnv = process.env.NODE_ENV === 'test';
    },

    visitor: {
      MemberExpression(path, state: ExpoRouterPluginState) {
        // Quick check: skip if not accessing something on an object named 'process'
        const object = path.node.object;
        if (!t.isMemberExpression(object)) return;

        const objectOfObject = object.object;
        if (!t.isIdentifier(objectOfObject) || objectOfObject.name !== 'process') return;

        // Now check if it's process.env
        if (!t.isIdentifier(object.property) || object.property.name !== 'env') return;

        // Skip if this is an assignment target
        if (t.isAssignmentExpression(path.parent) && path.parent.left === path.node) return;

        // Get the property key
        const key = path.toComputedKey();
        if (!t.isStringLiteral(key)) return;

        const keyValue = key.value;

        // Check each possible env var

        switch (keyValue) {
          case 'EXPO_PROJECT_ROOT':
            path.replaceWith(t.stringLiteral(state.projectRoot!));
            return;
          case 'EXPO_ROUTER_IMPORT_MODE':
            path.replaceWith(t.stringLiteral(importMode));
            return;
          default:
            break;
        }

        // Skip app root transforms in tests (handled by testing-library utils)
        if (state.isTestEnv) return;

        switch (keyValue) {
          case 'EXPO_ROUTER_ABS_APP_ROOT':
            path.replaceWith(t.stringLiteral(routerAbsoluteRoot));
            return;
          case 'EXPO_ROUTER_APP_ROOT': {
            // Use the actual file being transformed to compute the relative path.
            // This ensures the path is correct regardless of package hoisting.
            const filename = state.filename || state.file.opts.filename;
            if (!filename) {
              throw new Error(
                'babel-preset-expo: Unable to determine filename for EXPO_ROUTER_APP_ROOT transformation'
              );
            }
            path.replaceWith(t.stringLiteral(getExpoRouterAppRoot(filename, routerAbsoluteRoot)));
          }
        }
      },
    },
  };
}
