"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = minifyPlatformSelectPlugin;
function minifyPlatformSelectPlugin({ types: t, }) {
    function isPlatformSelect(path) {
        return (t.isMemberExpression(path.node.callee) &&
            t.isIdentifier(path.node.callee.object) &&
            t.isIdentifier(path.node.callee.property) &&
            path.node.callee.object.name === 'Platform' &&
            path.node.callee.property.name === 'select' &&
            t.isObjectExpression(path.node.arguments[0]));
    }
    function findProperty(objectExpression, key, fallback) {
        let value = null;
        for (const p of objectExpression.properties) {
            if (!t.isObjectProperty(p) && !t.isObjectMethod(p)) {
                continue;
            }
            if ((t.isIdentifier(p.key) && p.key.name === key) ||
                (t.isStringLiteral(p.key) && p.key.value === key)) {
                if (t.isObjectProperty(p)) {
                    value = p.value;
                    break;
                }
                else if (t.isObjectMethod(p)) {
                    value = t.toExpression(p);
                    break;
                }
            }
        }
        return value ?? fallback();
    }
    function hasStaticProperties(objectExpression) {
        return objectExpression.properties.every((p) => {
            if (('computed' in p && p.computed) || t.isSpreadElement(p)) {
                return false;
            }
            if (t.isObjectMethod(p) && p.kind !== 'method') {
                return false;
            }
            return t.isIdentifier(p.key) || t.isStringLiteral(p.key);
        });
    }
    return {
        visitor: {
            CallExpression(path, state) {
                const node = path.node;
                const arg = node.arguments[0];
                const opts = state.opts;
                if (isPlatformSelect(path) && t.isObjectExpression(arg)) {
                    if (hasStaticProperties(arg)) {
                        let fallback;
                        if (opts.platform === 'web') {
                            fallback = () => findProperty(arg, 'default', () => t.identifier('undefined'));
                        }
                        else {
                            fallback = () => findProperty(arg, 'native', () => findProperty(arg, 'default', () => t.identifier('undefined')));
                        }
                        path.replaceWith(findProperty(arg, opts.platform, fallback));
                    }
                }
            },
        },
    };
}
