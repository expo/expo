/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, types as t, PluginObj, PluginPass } from '@babel/core';

import { getExpoRouterAbsoluteAppRoot, getIsServer, toPosixPath } from '../common';

const debug = require('debug')('expo:babel:server-metadata');

const GENERATE_METADATA_EXPORT_NAME = 'generateMetadata';

export function serverMetadataPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj {
  const { types: t } = api;

  const routerAbsoluteRoot = api.caller(getExpoRouterAbsoluteAppRoot);
  const isServer = api.caller(getIsServer);

  return {
    name: 'expo-server-metadata',
    visitor: {
      ExportNamedDeclaration(path, state) {
        if (!isInAppDirectory(state.file.opts.filename ?? '', routerAbsoluteRoot)) {
          return;
        }

        if (isServer) {
          return;
        }

        const { declaration, specifiers } = path.node;
        const isTypeExport = path.node.exportKind === 'type';
        const hasSpecifiers = specifiers.length > 0;

        if (isTypeExport || hasSpecifiers) {
          return;
        }

        if (t.isFunctionDeclaration(declaration)) {
          const name = declaration.id?.name;
          if (name && isGenerateMetadataIdentifier(name)) {
            debug('Removing generateMetadata function declaration from client bundle');
            markForConstantFolding(state);
            path.remove();
          }
        }

        if (t.isVariableDeclaration(declaration)) {
          const nextDeclarations = declaration.declarations.filter(
            (declarator: t.VariableDeclarator) => {
              const name = t.isIdentifier(declarator.id) ? declarator.id.name : null;
              return !name || !isGenerateMetadataIdentifier(name);
            }
          );

          if (nextDeclarations.length !== declaration.declarations.length) {
            debug('Removing generateMetadata variable declaration from client bundle');
            markForConstantFolding(state);
            declaration.declarations = nextDeclarations;

            if (declaration.declarations.length === 0) {
              path.remove();
            }
          }
        }
      },
    },
  };
}

function isGenerateMetadataIdentifier(name: string): boolean {
  return name === GENERATE_METADATA_EXPORT_NAME;
}

function isInAppDirectory(filePath: string, routerRoot: string) {
  const normalizedFilePath = toPosixPath(filePath);
  const normalizedAppRoot = toPosixPath(routerRoot);
  return normalizedFilePath.startsWith(normalizedAppRoot + '/');
}

function assertExpoMetadata(metadata: any): asserts metadata is {
  performConstantFolding?: boolean;
} {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}

function markForConstantFolding(state: PluginPass) {
  assertExpoMetadata(state.file.metadata);
  state.file.metadata.performConstantFolding = true;
}
