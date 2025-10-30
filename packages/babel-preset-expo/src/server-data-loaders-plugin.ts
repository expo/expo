/**
 * Copyright © 2025 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, types as t, PluginObj } from '@babel/core';

import { getIsServer } from './common';

const debug = require('debug')('expo:babel:server-data-loaders');

const LOADER_EXPORT_NAME = 'loader';

export function serverDataLoadersPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;

  const isServer = api.caller(getIsServer);

  return {
    name: 'expo-server-data-loaders',

    pre(file) {
      // Early exit if file doesn't contain a `loader` named export
      if (!file.code.includes(LOADER_EXPORT_NAME)) {
        debug('Skipping file (no loader export):', file.opts.filename);
        file.path.stop();
        return;
      }

      debug(
        isServer ? 'Processing server bundle:' : 'Processing client bundle:',
        file.opts.filename
      );
    },

    visitor: {
      ExportNamedDeclaration(path, state) {
        if (isServer) {
          return;
        }

        const { declaration } = path.node;

        // Handles `export function loader() {}`
        if (t.isFunctionDeclaration(declaration)) {
          const name = declaration.id?.name;
          if (name && isLoaderIdentifier(name)) {
            debug('Found and removed loader function declaration');
            assertExpoMetadata(state.file.metadata);
            state.file.metadata.performConstantFolding = true;
            path.remove();
          }
        }

        // Handles `export const loader = ...`
        if (t.isVariableDeclaration(declaration)) {
          const originalLength = declaration.declarations.length;
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
          if (declaration.declarations.length === 0) {
            assertExpoMetadata(state.file.metadata);
            state.file.metadata.performConstantFolding = true;
            path.remove();
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
