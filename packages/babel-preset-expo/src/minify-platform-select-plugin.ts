/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigAPI, NodePath, types } from '@babel/core';

export default function minifyPlatformSelectPlugin({
  types: t,
}: ConfigAPI & { types: typeof types }): babel.PluginObj {
  return {
    visitor: {
      CallExpression(path, state) {
        const node = path.node;
        const arg = node.arguments[0];
        const opts = state.opts as { platform: string };
        if (isPlatformSelect(path) && types.isObjectExpression(arg)) {
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

function findProperty(objectExpression: types.ObjectExpression, key: string, fallback: () => any) {
  let value = null;
  for (const p of objectExpression.properties) {
    if (!types.isObjectProperty(p) && !types.isObjectMethod(p)) {
      continue;
    }
    if (
      (types.isIdentifier(p.key) && p.key.name === key) ||
      (types.isStringLiteral(p.key) && p.key.value === key)
    ) {
      if (types.isObjectProperty(p)) {
        value = p.value;
        break;
      } else if (types.isObjectMethod(p)) {
        value = types.toExpression(p);
        break;
      }
    }
  }
  return value ?? fallback();
}

function hasStaticProperties(objectExpression: types.ObjectExpression) {
  return objectExpression.properties.every((p) => {
    if (('computed' in p && p.computed) || types.isSpreadElement(p)) {
      return false;
    }
    if (types.isObjectMethod(p) && p.kind !== 'method') {
      return false;
    }
    return types.isIdentifier(p.key) || types.isStringLiteral(p.key);
  });
}
