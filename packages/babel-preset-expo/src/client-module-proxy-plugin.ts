/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, types } from '@babel/core';
import url from 'url';

export function reactClientReferencesPlugin(
  api: ConfigAPI & { types: typeof types }
): babel.PluginObj {
  const { types: t } = api;
  const reactServerAdapter = 'react-server-dom-webpack/server';
  return {
    name: 'expo-client-references',
    visitor: {
      Program(path, state) {
        const isUseClient = path.node.directives.some(
          (directive: any) => directive.value.value === 'use client'
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
        const outputKey = url.pathToFileURL(filePath).href;

        // File starts with "use client" directive.
        if (!isUseClient && !isUseServer) {
          // Do nothing for code that isn't marked as a client component.
          return;
        }

        // Clear the body
        if (isUseClient) {
          path.node.body = [];
          path.node.directives = [];

          // Inject the following:
          //
          // module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(`${outputKey}#${filePath}`)
          // TODO: Use `require.resolveWeak` instead of `filePath` to avoid leaking the file path.
          // module.exports = require('react-server-dom-webpack/server').createClientModuleProxy(`${outputKey}#${require.resolveWeak(filePath)}`)
          path.pushContainer(
            'body',
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(t.identifier('module'), t.identifier('exports')),
                t.callExpression(
                  t.memberExpression(
                    t.callExpression(t.identifier('require'), [
                      t.stringLiteral(reactServerAdapter),
                    ]),
                    t.identifier('createClientModuleProxy')
                  ),
                  // `${outputKey}#${require.resolveWeak(filePath)}`
                  [t.stringLiteral(outputKey)]
                )
              )
            )
          );
        } else {
          // Inject the following:
          //
          // ;(() => {
          //  const { registerServerReference } = require('react-server-dom-webpack/server');
          //  if (typeof module.exports === 'function') registerServerReference(module.exports, moduleId, null);
          //  else {
          //    for (const key in module.exports) {
          //      if (typeof module.exports[key] === 'function') {
          //        registerServerReference(module.exports[key], moduleId, key);
          //       }
          //     }
          //   }
          // })()

          const mmexp = t.memberExpression(
            t.callExpression(t.identifier('require'), [t.stringLiteral(reactServerAdapter)]),
            t.identifier('registerServerReference')
          );

          // Create the loop body
          const loopBody = t.blockStatement([
            t.ifStatement(
              t.binaryExpression(
                '===',
                t.unaryExpression(
                  'typeof',
                  t.memberExpression(
                    t.memberExpression(t.identifier('module'), t.identifier('exports')),
                    t.identifier('key'),
                    true
                  )
                ),
                t.stringLiteral('function')
              ),
              t.expressionStatement(
                t.callExpression(mmexp, [
                  t.memberExpression(
                    t.memberExpression(t.identifier('module'), t.identifier('exports')),
                    t.identifier('key'),
                    true
                  ),
                  t.stringLiteral(outputKey),
                  t.identifier('key'),
                ])
              )
            ),
          ]);

          // Create the for-in loop
          const forInStatement = t.forInStatement(
            t.variableDeclaration('const', [t.variableDeclarator(t.identifier('key'))]),
            t.memberExpression(t.identifier('module'), t.identifier('exports')),
            loopBody
          );

          path.pushContainer(
            'body',
            t.expressionStatement(
              t.callExpression(
                t.arrowFunctionExpression(
                  [],

                  t.blockStatement([
                    t.ifStatement(
                      t.binaryExpression(
                        '===',
                        t.unaryExpression(
                          'typeof',
                          t.memberExpression(t.identifier('module'), t.identifier('exports'))
                        ),
                        t.stringLiteral('function')
                      ),
                      // registerServerReference(module.exports, moduleId, null);
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(mmexp, [
                            t.memberExpression(t.identifier('module'), t.identifier('exports')),
                            t.stringLiteral(outputKey),
                            t.nullLiteral(),
                          ])
                        ),
                      ]),
                      // Else
                      t.blockStatement([
                        // for (const key in module.exports) {
                        //   if (typeof module.exports[key] === 'function') {
                        //     registerServerReference(module.exports[key], moduleId, key);
                        //   }
                        // }
                        forInStatement,
                      ])
                    ),
                  ])
                ),
                []
              )
            )
          );

          //
        }
      },
    },
  };
}
