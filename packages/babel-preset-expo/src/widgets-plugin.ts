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

const SWIFT_UI_IMPORT_SOURCE = '@expo/ui/swift-ui';

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
      JSXOpeningElement(path) {
        if (!isWidgetButtonElement(path) || hasJSXAttribute(path.node, 'target')) {
          return;
        }

        path.node.attributes.push(
          t.jsxAttribute(t.jsxIdentifier('target'), buildButtonTargetAttributeValue(path))
        );
      },
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

  function isWidgetButtonElement(path: NodePath<t.JSXOpeningElement>) {
    if (!hasWidgetFunctionAncestor(path)) {
      return false;
    }

    return isSwiftUIButtonReference(path);
  }

  function isSwiftUIButtonReference(path: NodePath<t.JSXOpeningElement>) {
    const { name } = path.node;

    if (t.isJSXIdentifier(name)) {
      // Handles `import { Button } from '@expo/ui/swift-ui'`
      // and aliased imports like `import { Button as SwiftUIButton } ...`.
      const binding = path.scope.getBinding(name.name);
      if (!binding?.path.isImportSpecifier()) {
        return false;
      }

      if (
        !binding.path.parentPath.isImportDeclaration() ||
        binding.path.parentPath.node.source.value !== SWIFT_UI_IMPORT_SOURCE
      ) {
        return false;
      }

      return (
        t.isIdentifier(binding.path.node.imported, { name: 'Button' }) ||
        t.isStringLiteral(binding.path.node.imported, { value: 'Button' })
      );
    }

    if (!t.isJSXMemberExpression(name) || !t.isJSXIdentifier(name.object)) {
      return false;
    }

    // Handles namespace imports like `import * as SwiftUI from '@expo/ui/swift-ui'`.
    if (!t.isJSXIdentifier(name.property, { name: 'Button' })) {
      return false;
    }

    const binding = path.scope.getBinding(name.object.name);
    if (
      !binding?.path.isImportNamespaceSpecifier() ||
      !binding.path.parentPath.isImportDeclaration() ||
      binding.path.parentPath.node.source.value !== SWIFT_UI_IMPORT_SOURCE
    ) {
      return false;
    }

    return true;
  }

  function buildButtonTargetAttributeValue(
    path: NodePath<t.JSXOpeningElement>
  ): t.JSXAttribute['value'] {
    const baseTarget = getWidgetTargetId(path.node);
    const nearestParentKey = getNearestParentJSXKey(path);

    if (nearestParentKey == null) {
      return t.stringLiteral(baseTarget);
    }
    if (typeof nearestParentKey === 'string') {
      return t.stringLiteral(`${baseTarget}__${nearestParentKey}`);
    }

    return t.jsxExpressionContainer(
      t.templateLiteral(
        [
          t.templateElement({ raw: `${baseTarget}__`, cooked: `${baseTarget}__` }),
          t.templateElement({ raw: '', cooked: '' }, true),
        ],
        [nearestParentKey]
      )
    );
  }

  function getNearestParentJSXKey(
    path: NodePath<t.JSXOpeningElement>
  ): string | t.Expression | null {
    let current = path.parentPath?.parentPath;

    while (current) {
      if (current.isJSXElement()) {
        const keyAttribute = getJSXAttribute(current.node.openingElement, 'key');
        const value = keyAttribute ? getJSXAttributeValue(keyAttribute) : null;
        if (value != null) {
          return value;
        }
      }
      current = current.parentPath;
    }

    return null;
  }

  function getJSXAttribute(node: t.JSXOpeningElement, name: string): t.JSXAttribute | undefined {
    return node.attributes.find(
      (attribute): attribute is t.JSXAttribute =>
        t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name })
    );
  }

  function getJSXAttributeValue(attribute: t.JSXAttribute): string | t.Expression | null {
    const { value } = attribute;
    if (!value) {
      return null;
    }

    if (t.isStringLiteral(value)) {
      return value.value;
    }

    if (t.isJSXExpressionContainer(value) && !t.isJSXEmptyExpression(value.expression)) {
      return value.expression;
    }

    return null;
  }

  function hasJSXAttribute(node: t.JSXOpeningElement, name: string) {
    return !!getJSXAttribute(node, name);
  }

  function hasWidgetFunctionAncestor(path: NodePath) {
    let current = path.parentPath;

    while (current) {
      if (current.isFunction() && isWidgetFunction(current)) {
        return true;
      }
      current = current.parentPath;
    }

    return false;
  }

  function getWidgetTargetId(node: { start?: number | null; loc?: t.SourceLocation | null }) {
    if (typeof node.start === 'number') {
      return `__expo_widgets_target_${node.start}`;
    }

    const line = node.loc?.start.line;
    const column = node.loc?.start.column;
    if (typeof line === 'number' && typeof column === 'number') {
      return `__expo_widgets_target_${line}_${column}`;
    }

    return '__expo_widgets_target';
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
  return generator.generate(expression, { compact: true }).code;
}

function buildTemplateLiteral(t: typeof import('@babel/core').types, code: string) {
  const raw = escapeTemplateLiteral(code);
  return t.templateLiteral([t.templateElement({ raw, cooked: raw }, true)], []);
}

function escapeTemplateLiteral(value: string) {
  return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}
