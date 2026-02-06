/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Babel plugin that transforms widget component JSX expressions.
 */

import type { ConfigAPI, NodePath, PluginObj, PluginPass, types as t } from '@babel/core';
import * as generator from '@babel/generator';

const WidgetizableFunction =
  'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ObjectMethod';

export function widgetsPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<
  PluginPass & {
    widgetComponents?: Map<
      NodePath<t.Function>,
      { propNames: Set<string>; propsIdentifier?: string }
    >;
  }
> {
  const { types: t } = api;
  return {
    name: 'expo-widgets',
    visitor: {
      [WidgetizableFunction as 'FunctionDeclaration']: {
        exit(path) {
          if (!t.isBlockStatement(path.node.body)) {
            return;
          }
          // Skip if no 'widget' directive
          if (
            !path.node.body.directives.some(
              (directive) =>
                t.isDirectiveLiteral(directive.value) && directive.value.value === 'widget'
            )
          ) {
            return;
          }
          // Remove the 'widget' directive to avoid runtime overhead
          path.traverse({
            DirectiveLiteral(nodePath) {
              if (nodePath.node.value === 'widget' && nodePath.getFunctionParent() === path) {
                nodePath.parentPath.remove();
              }
            },
          });

          const code = generateWidgetFunctionString(t, path.node);
          replaceWidgetFunction(t, path, code);
        },
      },
    },
  };
}

function generateWidgetFunctionString(
  t: typeof import('@babel/core').types,
  node: t.Function
): string {
  const expression = t.functionExpression(
    null,
    node.params as t.FunctionExpression['params'],
    node.body as t.BlockStatement,
    node.generator,
    node.async
  );
  return generator.generate(expression, { compact: false }).code;
}

function replaceWidgetFunction(
  t: typeof import('@babel/core').types,
  path: NodePath<t.Function>,
  code: string
) {
  const literal = buildTemplateLiteral(t, code);

  if (path.isObjectMethod()) {
    path.replaceWith(t.objectProperty(path.node.key, literal, path.node.computed));
    return;
  }

  if (path.isFunctionDeclaration()) {
    if (path.parentPath.isExportDefaultDeclaration()) {
      path.parentPath.replaceWith(t.exportDefaultDeclaration(literal));
      return;
    }

    if (path.node.id) {
      path.replaceWith(t.variableDeclaration('var', [t.variableDeclarator(path.node.id, literal)]));
    } else {
      path.replaceWith(literal);
    }
    return;
  }

  path.replaceWith(literal);
}

function buildTemplateLiteral(t: typeof import('@babel/core').types, code: string) {
  const raw = escapeTemplateLiteral(code);
  return t.templateLiteral([t.templateElement({ raw, cooked: raw }, true)], []);
}

function escapeTemplateLiteral(value: string) {
  return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
