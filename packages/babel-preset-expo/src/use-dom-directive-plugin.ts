/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, template, types } from '@babel/core';
import crypto from 'crypto';
import { basename } from 'path';
import url from 'url';

import { getIsProd, getPossibleProjectRoot } from './common';

export function expoUseDomDirectivePlugin(
  api: ConfigAPI & { types: typeof types }
): babel.PluginObj {
  const { types: t } = api;

  const isProduction = api.caller(getIsProd);
  const platform = api.caller((caller) => (caller as any)?.platform);
  const projectRoot = api.caller(getPossibleProjectRoot);

  return {
    name: 'expo-use-dom-directive',
    visitor: {
      Program(path, state) {
        // Native only feature.
        if (platform === 'web') {
          return;
        }

        const hasUseDomDirective = path.node.directives.some(
          (directive) => directive.value.value === 'use dom'
        );

        const filePath = state.file.opts.filename;

        if (!filePath) {
          // This can happen in tests or systems that use Babel standalone.
          throw new Error('[Babel] Expected a filename to be set in the state');
        }

        // File starts with "use dom" directive.
        if (!hasUseDomDirective) {
          // Do nothing for code that isn't marked as a dom component.
          return;
        }

        let displayName: string = 'Component';
        // Assert that a default export must exist and that no other exports should be present.
        // NOTE: In the future we could support other exports with extraction.

        let hasDefaultExport = false;
        // Collect all of the exports

        path.traverse({
          ExportNamedDeclaration(path) {
            const declaration = path.node.declaration;
            if (
              t.isTypeAlias(declaration) ||
              t.isInterfaceDeclaration(declaration) ||
              t.isTSTypeAliasDeclaration(declaration) ||
              t.isTSInterfaceDeclaration(declaration)
            ) {
              // Allows type exports
              return;
            }

            throw path.buildCodeFrameError(
              'Modules with the "use dom" directive only support a single default export.'
            );
          },
          ExportDefaultDeclaration(path) {
            hasDefaultExport = true;

            if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
              displayName = path.node.declaration.id.name;
            }
          },
        });

        if (!hasDefaultExport) {
          throw path.buildCodeFrameError(
            'The "use dom" directive requires a default export to be present in the file.'
          );
        }

        // Assert that _layout routes cannot be used in DOM components.
        const fileBasename = basename(filePath);

        if (
          projectRoot &&
          // Detecting if the file is in the router root would be extensive as it would cause a more complex
          // cache key for each file. Instead, let's just check if the file is in the project root and is not a node_module,
          // then we can assert that users should not use `_layout` or `+api` with "use dom".
          filePath.includes(projectRoot) &&
          !filePath.match(/node_modules/)
        ) {
          if (fileBasename.match(/^_layout\.[jt]sx?$/)) {
            throw path.buildCodeFrameError(
              'Layout routes cannot be marked as DOM components because they cannot render native views.'
            );
          } else if (
            // No API routes
            fileBasename.match(/\+api\.[jt]sx?$/)
          ) {
            throw path.buildCodeFrameError('API routes cannot be marked as DOM components.');
          }
        }

        const outputKey = url.pathToFileURL(filePath).href;

        // Removes all imports using babel API, that will disconnect import bindings from the program.
        // plugin-transform-typescript TSX uses the bindings to remove type imports.
        // If the DOM component has `import React from 'react';`,
        // the plugin-transform-typescript treats it as an typed import and removes it.
        // That will further cause undefined `React` error.
        path.traverse({
          ImportDeclaration(path) {
            path.remove();
          },
        });
        path.node.body = [];
        path.node.directives = [];

        // Create template with declaration first
        const proxyModuleTemplate = `
          import React from 'react';
          import { WebView } from 'expo/dom/internal';
          ${
            isProduction
              ? `const filePath = "${crypto.createHash('sha1').update(outputKey).digest('hex')}.html";`
              : `const filePath = "${fileBasename}?file=" + ${JSON.stringify(outputKey)};`
          }
          const _Expo_DOMProxyComponent = React.forwardRef((props, ref) => {
            return React.createElement(WebView, { ref, ...props, filePath });
          });
          if (__DEV__) _Expo_DOMProxyComponent.displayName = ${JSON.stringify(`DOM(${displayName})`)};
          export default _Expo_DOMProxyComponent;
        `;

        // Convert template to AST and push to body
        const ast = template.ast(proxyModuleTemplate);
        const results = path.pushContainer('body', ast);

        // Find and register the component declaration
        results.forEach((nodePath) => {
          if (
            t.isVariableDeclaration(nodePath.node) &&
            'name' in nodePath.node.declarations[0]?.id &&
            nodePath.node.declarations[0].id.name === '_Expo_DOMProxyComponent'
          ) {
            path.scope.registerDeclaration(nodePath);
          }
        });

        assertExpoMetadata(state.file.metadata);

        // Save the client reference in the metadata.
        state.file.metadata.expoDomComponentReference = outputKey;
      },
    },
  };
}

function assertExpoMetadata(
  metadata: any
): asserts metadata is { expoDomComponentReference?: string } {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}
