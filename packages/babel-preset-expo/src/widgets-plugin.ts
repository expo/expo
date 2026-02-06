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
      ['FunctionDeclaration|FunctionExpression' as 'FunctionDeclaration']: {
        exit(path: NodePath<t.FunctionDeclaration | t.FunctionExpression>) {
          if (!isWidgetFunction(path)) {
            return;
          }
          removeWidgetDirective(path.node.body);
          const code = generateWidgetFunctionString(t, path.node);
          const literal = buildTemplateLiteral(t, code);

          if (path.parentPath.isExportDefaultDeclaration()) {
            path.parentPath.replaceWith(t.exportDefaultDeclaration(literal));
            return;
          }

          if (path.node.id) {
            path.replaceWith(
              t.variableDeclaration('var', [t.variableDeclarator(path.node.id, literal)])
            );
          } else {
            path.replaceWith(literal);
          }
        },
      },
      ArrowFunctionExpression: {
        exit(path) {
          if (!isWidgetFunction(path)) {
            return;
          }
          // Check above will guarantee body is a BlockStatement
          removeWidgetDirective(path.node.body as t.BlockStatement);
          const code = generateWidgetFunctionString(t, path.node);
          const literal = buildTemplateLiteral(t, code);
          path.replaceWith(literal);
        },
      },
      ObjectMethod: {
        exit(path) {
          if (!isWidgetFunction(path)) {
            return;
          }
          removeWidgetDirective(path.node.body);
          const code = generateWidgetFunctionString(t, path.node);
          const literal = buildTemplateLiteral(t, code);
          path.replaceWith(t.objectProperty(path.node.key, literal, path.node.computed));
        },
      },
    },
  };

  function isWidgetFunction(path: NodePath<t.Function>) {
    if (!t.isBlockStatement(path.node.body)) {
      return false;
    }
    return path.node.body.directives.some(
      (directive) => t.isDirectiveLiteral(directive.value) && directive.value.value === 'widget'
    );
  }

  function removeWidgetDirective(body: t.BlockStatement) {
    const widgetDirectiveIndex = body.directives.findIndex(
      (directive) => t.isDirectiveLiteral(directive.value) && directive.value.value === 'widget'
    );
    if (widgetDirectiveIndex !== -1) {
      body.directives.splice(widgetDirectiveIndex, 1);
    }
  }
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

function buildTemplateLiteral(t: typeof import('@babel/core').types, code: string) {
  const raw = escapeTemplateLiteral(code);
  return t.templateLiteral([t.templateElement({ raw, cooked: raw }, true)], []);
}

function escapeTemplateLiteral(value: string) {
  return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
