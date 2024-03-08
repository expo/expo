/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigAPI, NodePath, types } from '@babel/core';

function isPlatformSelect(path: NodePath<types.CallExpression>): boolean {
  return (
    types.isMemberExpression(path.node.callee) &&
    types.isIdentifier(path.node.callee.object) &&
    types.isIdentifier(path.node.callee.property) &&
    path.node.callee.object.name === 'Platform' &&
    path.node.callee.property.name === 'select' &&
    types.isObjectExpression(path.node.arguments[0])
  );
}

function isPathImportedFrom(path: NodePath<types.Node>, moduleName: string): boolean {
  const binding = path.scope.getBinding(path);
  console.log('isPathImportedFrom:', binding);
  if (binding) {
    const parent = binding.path.parent;
    if (types.isImportDeclaration(parent)) {
      return true;
    }
  }
  return false;
}

export default function inlinePlugin({
  types: t,
}: ConfigAPI & { types: typeof types }): babel.PluginObj {
  const {
    isAssignmentExpression,
    isObjectExpression,
    isObjectMethod,
    isObjectProperty,
    isSpreadElement,
    isIdentifier,
    isStringLiteral,
    isNumericLiteral,
    isMemberExpression,
    isCallExpression,
  } = t;

  const requireName = 'require';

  const isPlatformNode = (node: types.MemberExpression) =>
    isIdentifier(node.property, {
      name: 'OS',
    }) &&
    isMemberExpression(node.object) &&
    isIdentifier(node.object, {
      name: 'Platform',
    }) &&
    isImport(node.object);

  const isPlatformSelectNode = (node: types.CallExpression) =>
    isMemberExpression(node.callee) &&
    isIdentifier(node.callee.property, {
      name: 'select',
    }) &&
    isMemberExpression(node.callee.object) &&
    isIdentifier(node.callee.object.property, {
      name: 'Platform',
    }) &&
    isImport(node.callee.object.object);

  const isRequireCall = (node: types.Expression, dependencyId: string) =>
    isCallExpression(node) &&
    isIdentifier(node.callee, {
      name: requireName,
    }) &&
    checkRequireArgs(node.arguments, dependencyId);

  const isImport = (node: types.Expression) =>
    [
      'react-native',
      'react-native-web',
      'react-native-web',
      'react-native-web/dist/exports/Platform',
      'expo-modules-core',
    ].some((pattern) => {
      console.log('isImport:', node, pattern);
      return isRequireCall(node, pattern);
    });

  const checkRequireArgs = (
    args: (
      | types.Expression
      | types.ArgumentPlaceholder
      | types.JSXNamespacedName
      | types.SpreadElement
    )[],
    dependencyId: string
  ) => {
    const pattern = t.stringLiteral(dependencyId);
    return (
      isStringLiteral(args[0], pattern) ||
      (isMemberExpression(args[0]) &&
        isNumericLiteral(args[0].property) &&
        isStringLiteral(args[1], pattern))
    );
  };

  const isLeftHandSideOfAssignmentExpression = (node: types.MemberExpression, parent: types.Node) =>
    isAssignmentExpression(parent) && parent.left === node;
  function findProperty(
    objectExpression: types.ObjectExpression,
    key: string,
    fallback: () => any
  ) {
    let value = null;
    for (const p of objectExpression.properties) {
      if (!isObjectProperty(p) && !isObjectMethod(p)) {
        continue;
      }
      if (
        (isIdentifier(p.key) && p.key.name === key) ||
        (isStringLiteral(p.key) && p.key.value === key)
      ) {
        if (isObjectProperty(p)) {
          value = p.value;
          break;
        } else if (isObjectMethod(p)) {
          value = t.toExpression(p);
          break;
        }
      }
    }
    return value ?? fallback();
  }
  function hasStaticProperties(objectExpression: types.ObjectExpression) {
    return objectExpression.properties.every((p) => {
      if (('computed' in p && p.computed) || isSpreadElement(p)) {
        return false;
      }
      if (isObjectMethod(p) && p.kind !== 'method') {
        return false;
      }
      return isIdentifier(p.key) || isStringLiteral(p.key);
    });
  }
  return {
    visitor: {
      MemberExpression(path, state) {
        const node = path.node;
        const opts = state.opts as { platform: string };
        if (
          !isLeftHandSideOfAssignmentExpression(node, path.parent) &&
          types.isMemberExpression(node)
        ) {
          console.log('abc:', isPathImportedFrom(path, 'react-native'), node);
          if (isPlatformNode(node)) {
            path.replaceWith(t.stringLiteral(opts.platform));
          }
        }
      },
      CallExpression(path, state) {
        const node = path.node;
        const arg = node.arguments[0];
        const opts = state.opts as { platform: string };
        if (isPlatformSelectNode(node) && isObjectExpression(arg)) {
          if (hasStaticProperties(arg)) {
            let fallback: any;
            if (opts.platform === 'web') {
              fallback = () => findProperty(arg, 'default', () => t.identifier('undefined'));
            } else {
              fallback = () =>
                findProperty(arg, 'native', () =>
                  findProperty(arg, 'default', () => t.identifier('undefined'))
                );
            }
            path.replaceWith(findProperty(arg, opts.platform, fallback));
          }
        }
      },
    },
  };
}

type Scope = NodePath<types.CallExpression>['scope'];
