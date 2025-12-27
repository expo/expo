/**
 * Copyright © 2024 650 Industries.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
import { relative as getRelativePath } from 'node:path';
import url from 'node:url';

import { getIsReactServer, getPossibleProjectRoot, toPosixPath } from './common';

/**
 * Generate a stable ID for RSC client/server boundary modules.
 *
 * Uses relative paths from project root, with pnpm symlink normalization.
 * Format: ./path/to/file.js or ./node_modules/pkg/file.js
 */
function generateStableId(filePath: string, projectRoot: string): string {
  let relativePath = getRelativePath(projectRoot, filePath);

  // pnpm normalization: .pnpm/pkg@1.0.0/node_modules/pkg/... → pkg/...
  // This handles pnpm's symlinked node_modules structure
  relativePath = relativePath.replace(
    /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
    'node_modules/'
  );

  const stableId = './' + toPosixPath(relativePath);

  if (process.env.EXPO_DEBUG) {
    console.log('[RSC-BABEL] generateStableId:', filePath, '->', stableId);
  }

  return stableId;
}

export function reactClientReferencesPlugin(
  api: ConfigAPI & typeof import('@babel/core')
): PluginObj {
  const { template, types } = api;
  const isReactServer = api.caller(getIsReactServer);
  const possibleProjectRoot = api.caller(getPossibleProjectRoot);

  return {
    name: 'expo-client-references',
    visitor: {
      Program(path, state) {
        // Check directives array (standard location for directives)
        let isUseClient = path.node.directives.some(
          (directive: any) =>
            directive.value.value === 'use client' ||
            // Convert DOM Components to client proxies in React Server environments.
            directive.value.value === 'use dom'
        );
        let isUseServer = path.node.directives.some(
          (directive: any) => directive.value.value === 'use server'
        );

        // Also check body for string literal statements (handles pre-built files where
        // "use strict" and comments may come before "use client"/"use server")
        // This matches React's acorn-based detection and Next.js's approach
        if (!isUseClient && !isUseServer) {
          for (const node of path.node.body) {
            // Stop at non-expression statements
            if (node.type !== 'ExpressionStatement') break;
            // Check for string literal
            const expr = (node as any).expression;
            if (expr?.type === 'StringLiteral' || expr?.type === 'Literal') {
              const value = expr.value;
              if (value === 'use client' || value === 'use dom') {
                isUseClient = true;
                break;
              }
              if (value === 'use server') {
                isUseServer = true;
                break;
              }
            } else {
              // Non-string-literal expression, stop looking for directives
              break;
            }
          }
        }

        if (isUseClient && isUseServer) {
          throw path.buildCodeFrameError(
            'It\'s not possible to have both "use client" and "use server" directives in the same file.'
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

        const projectRoot = possibleProjectRoot || state.file.opts.root || '';

        // Generate stable ID directly using relative path from project root
        const outputKey = generateStableId(filePath, projectRoot);

        function iterateExports(callback: (exportName: string, path: any) => void, type: string) {
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
                      callback(exportName, exportPath);
                    }
                  });
                } else if (exportPath.node.declaration.type === 'FunctionDeclaration') {
                  const exportName = exportPath.node.declaration.id?.name;
                  if (exportName) {
                    exportNames.add(exportName);
                    callback(exportName, exportPath);
                  }
                } else if (exportPath.node.declaration.type === 'ClassDeclaration') {
                  const exportName = exportPath.node.declaration.id?.name;
                  if (exportName) {
                    exportNames.add(exportName);
                    callback(exportName, exportPath);
                  }
                } else if (
                  ![
                    'InterfaceDeclaration',
                    'TSInterfaceDeclaration',
                    'TSTypeAliasDeclaration',
                    'TypeAlias',
                  ].includes(exportPath.node.declaration.type)
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
                    callback(exportName, exportPath);
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
            ExportDefaultDeclaration(path) {
              exportNames.add('default');
              callback('default', path);
            },
            ExportAllDeclaration(exportPath) {
              if (exportPath.node.source) {
                // exportNames.add('*');
                callback('*', exportPath);
              }
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

          // Assert that assignment to `module.exports` or `exports` is not allowed.
          path.traverse({
            AssignmentExpression(path) {
              if (
                types.isMemberExpression(path.node.left) &&
                'name' in path.node.left.object &&
                (path.node.left.object.name === 'module' ||
                  path.node.left.object.name === 'exports')
              ) {
                throw path.buildCodeFrameError(
                  'Assignment to `module.exports` or `exports` is not allowed in a "use server" file. Only async functions can be exported.'
                );
              }
            },
            // Also check Object.assign
            CallExpression(path) {
              if (
                types.isMemberExpression(path.node.callee) &&
                'name' in path.node.callee.property &&
                'name' in path.node.callee.object &&
                path.node.callee.property.name === 'assign' &&
                (path.node.callee.object.name === 'Object' ||
                  path.node.callee.object.name === 'exports')
              ) {
                throw path.buildCodeFrameError(
                  'Assignment to `module.exports` or `exports` is not allowed in a "use server" file. Only async functions can be exported.'
                );
              }
            },
          });

          // Handle "use server" in the client.

          const proxyModule = [
            `import { createServerReference } from 'react-server-dom-webpack/client';`,
            `import { callServerRSC } from 'expo-router/rsc/internal';`,
          ];

          const getProxy = (exportName: string) => {
            return `createServerReference(${JSON.stringify(`${outputKey}#${exportName}`)}, callServerRSC)`;
          };

          const pushProxy = (exportName: string, path: any) => {
            if (exportName === 'default') {
              proxyModule.push(`export default ${getProxy(exportName)};`);
            } else if (exportName === '*') {
              throw path.buildCodeFrameError(
                'Re-exporting all modules is not supported in a "use server" file. Only async functions can be exported.'
              );
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
          // Use file:// URL for bundling purposes (converted to stable ID by serializer)
          state.file.metadata.reactServerReference = url.pathToFileURL(filePath).href;
        } else if (isUseClient) {
          // Always set metadata for client boundaries (needed by serializer for module map)
          // Use file:// URL for metadata (converted to stable ID by serializer)
          assertExpoMetadata(state.file.metadata);
          state.file.metadata.reactClientReference = url.pathToFileURL(filePath).href;

          if (!isReactServer) {
            // Don't transform the code on the client - just set metadata above
            return;
          }

          // HACK: Mock out the polyfill that doesn't run through the normal bundler pipeline.
          if (
            filePath.endsWith('@react-native/js-polyfills/console.js') ||
            filePath.endsWith('@react-native\\js-polyfills\\console.js')
          ) {
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

          const pushProxy = (exportName: string) => {
            if (exportName === 'default') {
              proxyModule.push(`export default require("react-server-dom-webpack/server").registerClientReference(function () {
                throw new Error(${JSON.stringify(
                  `Attempted to call the default export of ${filePath} from the server but it's on the client. ` +
                    `It's not possible to invoke a client function from the server, it can ` +
                    `only be rendered as a Component or passed to props of a Client Component.`
                )});
                }, ${JSON.stringify(outputKey)}, ${JSON.stringify(exportName)});`);
            } else if (exportName === '*') {
              // Do nothing because we have the top-level hack to inject module.exports.
            } else {
              proxyModule.push(`export const ${exportName} = require("react-server-dom-webpack/server").registerClientReference(function () {
                throw new Error(${JSON.stringify(
                  `Attempted to call ${exportName}() of ${filePath} from the server but ${exportName} is on the client. ` +
                    `It's not possible to invoke a client function from the server, it can ` +
                    `only be rendered as a Component or passed to props of a Client Component.`
                )});
                }, ${JSON.stringify(outputKey)}, ${JSON.stringify(exportName)});`);
            }
          };
          // TODO: How to handle `export * from './module'`?
          // TODO: How to handle module.exports, do we just assert that it isn't supported with server components?

          // Collect all of the exports
          const proxyExports = iterateExports(pushProxy, 'client');

          // Clear the body
          path.node.body = [];
          path.node.directives = [];

          path.pushContainer('body', template.ast(proxyModule.join('\n')));

          assertExpoMetadata(state.file.metadata);
          // Store the proxy export names for testing purposes.
          state.file.metadata.proxyExports = [...proxyExports];

          // Save the client reference in the metadata (already set above via file:// URL).
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
