/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, types as t, PluginObj, NodePath, PluginPass } from '@babel/core';

import { getExpoRouterAbsoluteAppRoot, getIsServer, toPosixPath } from './common';

const debug = require('debug')('expo:babel:server-data-loaders');

const LOADER_EXPORT_NAME = 'loader';

export function serverDataLoadersPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;

  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);
  const isServer = api.caller(getIsServer);

  return {
    name: 'expo-server-data-loaders',
    visitor: {
      ExportNamedDeclaration(path, state) {
        if (isServer) {
          return;
        }

        // Early exit if file is not within the `app/` directory
        if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
          debug('Skipping file outside app directory:', state.file.opts.filename);
          return;
        }

        debug(
          isServer ? 'Processing server bundle:' : 'Processing client bundle:',
          state.file.opts.filename
        );

        const { declaration, specifiers } = path.node;
        const hasNoSpecifiers = specifiers.length === 0;

        if (path.node.exportKind === 'type') {
          return;
        }

        // Handles `export function loader() {}`
        if (t.isFunctionDeclaration(declaration)) {
          const name = declaration.id?.name;
          if (name && isLoaderIdentifier(name) && hasNoSpecifiers) {
            debug('Found and removed loader function declaration');
            markForConstantFolding(path, state);
          }
        }

        // Handles `export const loader = ...`
        if (t.isVariableDeclaration(declaration)) {
          declaration.declarations = declaration.declarations.filter(
            (declarator: t.VariableDeclarator) => {
              const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
              if (name && isLoaderIdentifier(name)) {
                debug('Found and removed loader variable declaration');
                return false;
              }
              return true;
            }
          );

          // If all declarations were removed, remove the export
          if (declaration.declarations.length === 0 && hasNoSpecifiers) {
            markForConstantFolding(path, state);
          }
        }
      },
    },
  };
}

/**
 * Checks if identifier name is `loader`
 */
function isLoaderIdentifier(name: string): boolean {
  return name === LOADER_EXPORT_NAME;
}

function assertExpoMetadata(metadata: any): asserts metadata is {
  performConstantFolding?: boolean;
} {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}

/**
 * Check if file is within the `app/` directory
 */
function isInAppDirectory(filePath: string, routerRoot: string) {
  const normalizedFilePath = toPosixPath(filePath);
  const normalizedAppRoot = toPosixPath(routerRoot);
  return normalizedFilePath.startsWith(normalizedAppRoot + '/');
}

/**
 * Marks a file for Metro's constant folding. This will work for both development and production bundles.
 *
 * @see packages/@expo/metro-config/src/transform-worker/metro-transform-worker.ts#transformJS
 */
function markForConstantFolding(path: NodePath<t.ExportNamedDeclaration>, state: PluginPass) {
  assertExpoMetadata(state.file.metadata);
  state.file.metadata.performConstantFolding = true;
  path.remove();
}
