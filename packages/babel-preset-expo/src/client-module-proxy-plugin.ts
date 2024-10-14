/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, template, types } from '@babel/core';
import url from 'url';

import { getIsReactServer } from './common';

export function reactClientReferencesPlugin(api: ConfigAPI): babel.PluginObj {
  const isReactServer = api.caller(getIsReactServer);

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

        if (!isUseClient && !isUseServer) {
          return;
        }

        const filePath = state.file.opts.filename;

        if (!filePath) {
          // This can happen in tests or systems that use Babel standalone.
          throw new Error('[Babel] Expected a filename to be set in the state');
        }

        const outputKey = url.pathToFileURL(filePath).href;

        function iterateExports(callback: (exportName: string) => void, type: string) {
          const exportNames = new Set<string>();
          // Collect all of the exports
          path.traverse({
            ExportNamedDeclaration(exportPath) {
              if (exportPath.node.declaration) {
                if (exportPath.node.declaration.type === 'VariableDeclaration') {
                  exportPath.node.declaration.declarations.forEach((declaration) => {
                    if (declaration.id.type === 'Identifier') {
                      const exportName = declaration.id.name;
                      exportNames.add(exportName);
                      callback(exportName);
                    }
                  });
                } else if (exportPath.node.declaration.type === 'FunctionDeclaration') {
                  const exportName = exportPath.node.declaration.id?.name;
                  if (exportName) {
                    exportNames.add(exportName);
                    callback(exportName);
                  }
                } else if (exportPath.node.declaration.type === 'ClassDeclaration') {
                  const exportName = exportPath.node.declaration.id?.name;
                  if (exportName) {
                    exportNames.add(exportName);
                    callback(exportName);
                  }
                } else if (
                  !['InterfaceDeclaration', 'TSTypeAliasDeclaration', 'TypeAlias'].includes(
                    exportPath.node.declaration.type
                  )
                ) {
                  // TODO: What is this type?
                  console.warn(
                    `[babel-preset-expo] Unsupported export specifier for "use ${type}":`,
                    exportPath.node.declaration.type
                  );
                }
              } else {
                exportPath.node.specifiers.forEach((specifier) => {
                  if (types.isIdentifier(specifier.exported)) {
                    const exportName = specifier.exported.name;
                    exportNames.add(exportName);
                    callback(exportName);
                  } else {
                    // TODO: What is this type?
                    console.warn(
                      `[babel-preset-expo] Unsupported export specifier for "use ${type}":`,
                      specifier
                    );
                  }
                });
              }
            },
            ExportDefaultDeclaration() {
              exportNames.add('default');
              callback('default');
            },
          });

          return exportNames;
        }

        // File starts with "use client" directive.
        if (isUseServer) {
          if (isReactServer) {
            // The "use server" transform for react-server is in a different plugin.
            return;
          }

          // Handle "use server" in the client.

          const proxyModule = [
            `import { createServerReference } from 'react-server-dom-webpack/client';`,
            `import { callServerRSC } from 'expo-router/rsc/internal';`,
          ];

          const getProxy = (exportName: string) => {
            return `createServerReference(${JSON.stringify(`${outputKey}#${exportName}`)}, callServerRSC)`;
          };

          const pushProxy = (exportName: string) => {
            if (exportName === 'default') {
              proxyModule.push(`export default ${getProxy(exportName)};`);
            } else {
              proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
            }
          };

          // We need to add all of the exports to support `export * from './module'` which iterates the keys of the module.
          // Collect all of the exports
          const proxyExports = iterateExports(pushProxy, 'client');

          // Clear the body
          path.node.body = [];
          path.node.directives = [];

          path.pushContainer('body', template.ast(proxyModule.join('\n')));

          assertExpoMetadata(state.file.metadata);

          // Store the proxy export names for testing purposes.
          state.file.metadata.proxyExports = [...proxyExports];

          // Save the server action reference in the metadata.
          state.file.metadata.reactServerReference = outputKey;
        } else if (isUseClient) {
          if (!isReactServer) {
            // Do nothing for "use client" on the client.
            return;
          }

          // HACK: Mock out the polyfill that doesn't run through the normal bundler pipeline.
          if (filePath.endsWith('@react-native/js-polyfills/console.js')) {
            // Clear the body
            path.node.body = [];
            path.node.directives = [];
            return;
          }

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

          const pushProxy = (exportName: string) => {
            if (exportName === 'default') {
              proxyModule.push(`export default ${getProxy(exportName)};`);
            } else {
              proxyModule.push(`export const ${exportName} = ${getProxy(exportName)};`);
            }
          };

          // Collect all of the exports
          const proxyExports = iterateExports(pushProxy, 'client');

          // Clear the body
          path.node.body = [];
          path.node.directives = [];

          path.pushContainer('body', template.ast(proxyModule.join('\n')));

          assertExpoMetadata(state.file.metadata);
          // Store the proxy export names for testing purposes.
          state.file.metadata.proxyExports = [...proxyExports];

          // Save the client reference in the metadata.
          state.file.metadata.reactClientReference = outputKey;
        }
      },
    },
  };
}

function assertExpoMetadata(metadata: any): asserts metadata is {
  reactServerReference?: string;
  reactClientReference?: string;
  proxyExports?: string[];
} {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}
