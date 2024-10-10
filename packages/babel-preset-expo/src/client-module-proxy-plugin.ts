/**
 * Copyright © 2024 650 Industries.
 */
import { template, types } from '@babel/core';
import url from 'url';

import type { BabelPresetExpoMetadata } from '.';

export function reactClientReferencesPlugin(): babel.PluginObj {
  return {
    name: 'expo-client-references',
    visitor: {
      Program(path, state) {
        const isUseClient = path.node.directives.some(
          (directive: any) =>
            directive.value.value === 'use client' ||
            // Convert DOM Components to client proxies in React Server environments.
            directive.value.value === 'use dom'
        );
        // TODO: use server can be added to scopes inside of the file. https://github.com/facebook/react/blob/29fbf6f62625c4262035f931681c7b7822ca9843/packages/react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js#L55
        const isUseServer = path.node.directives.some(
          (directive: any) => directive.value.value === 'use server'
        );

        if (isUseClient && isUseServer) {
          throw path.buildCodeFrameError(
            "It's not possible to have both `use client` and `use server` directives in the same file."
          );
        }

        const filePath = state.file.opts.filename;

        if (!filePath) {
          // This can happen in tests or systems that use Babel standalone.
          throw new Error('[Babel] Expected a filename to be set in the state');
        }

        // File starts with "use client" directive.
        if (!isUseClient) {
          // Do nothing for code that isn't marked as a client component.
          return;
        }

        const outputKey = url.pathToFileURL(filePath).href;

        // We need to add all of the exports to support `export * from './module'` which iterates the keys of the module.
        const proxyModule = [
          `const proxy = /*@__PURE__*/ require("react-server-dom-webpack/server").createClientModuleProxy(${JSON.stringify(
            outputKey
          )});`,
          `module.exports = proxy;`,
        ];

        const getProxy = (exportName: string) => {
          return `(/*@__PURE__*/ proxy[${JSON.stringify(exportName)}])`;
        };

        const proxyExports = new Set<string>();
        const pushProxy = (exportName: string) => {
          proxyExports.add(exportName);
          if (exportName === 'default') {
            proxyModule.push(`export default ${getProxy(exportName)};`);
          } else {
            proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
          }
        };

        // Collect all of the exports
        path.traverse({
          ExportNamedDeclaration(exportPath) {
            if (exportPath.node.declaration) {
              if (exportPath.node.declaration.type === 'VariableDeclaration') {
                exportPath.node.declaration.declarations.forEach((declaration) => {
                  if (declaration.id.type === 'Identifier') {
                    const exportName = declaration.id.name;
                    pushProxy(exportName);
                  }
                });
              } else if (exportPath.node.declaration.type === 'FunctionDeclaration') {
                const exportName = exportPath.node.declaration.id?.name;
                if (exportName) {
                  pushProxy(exportName);
                }
              } else if (exportPath.node.declaration.type === 'ClassDeclaration') {
                const exportName = exportPath.node.declaration.id?.name;
                if (exportName) {
                  pushProxy(exportName);
                }
              } else if (
                !['InterfaceDeclaration', 'TSTypeAliasDeclaration', 'TypeAlias'].includes(
                  exportPath.node.declaration.type
                )
              ) {
                // TODO: What is this type?
                console.warn(
                  '[babel-preset-expo] Unsupported export specifier for "use client":',
                  exportPath.node.declaration.type
                );
              }
            } else {
              exportPath.node.specifiers.forEach((specifier) => {
                if (types.isIdentifier(specifier.exported)) {
                  const exportName = specifier.exported.name;
                  pushProxy(exportName);
                } else {
                  // TODO: What is this type?
                  console.warn(
                    '[babel-preset-expo] Unsupported export specifier for "use client":',
                    specifier
                  );
                }
              });
            }
          },
          ExportDefaultDeclaration() {
            pushProxy('default');
          },
        });

        // Clear the body
        path.node.body = [];
        path.node.directives = [];

        path.pushContainer('body', template.ast(proxyModule.join('\n')));

        assertExpoMetadata(state.file.metadata);

        // Save the client reference in the metadata.
        state.file.metadata.reactClientReference = outputKey;

        // Store the proxy export names for testing purposes.
        state.file.metadata.proxyExports = [...proxyExports];
      },
    },
  };
}

function assertExpoMetadata(metadata: any): asserts metadata is Pick<
  BabelPresetExpoMetadata,
  'reactClientReference'
> & {
  proxyExports?: string[];
} {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}
