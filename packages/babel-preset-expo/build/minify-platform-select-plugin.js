"use strict";
/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
function minifyPlatformSelectPlugin({ types: t, }) {
    return {
        visitor: {
            CallExpression(path, state) {
                const node = path.node;
                const arg = node.arguments[0];
                const opts = state.opts;
                if (isPlatformSelect(path) && core_1.types.isObjectExpression(arg)) {
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
exports.default = minifyPlatformSelectPlugin;
function isPlatformSelect(path) {
    return (core_1.types.isMemberExpression(path.node.callee) &&
        core_1.types.isIdentifier(path.node.callee.object) &&
        core_1.types.isIdentifier(path.node.callee.property) &&
        path.node.callee.object.name === 'Platform' &&
        path.node.callee.property.name === 'select' &&
        core_1.types.isObjectExpression(path.node.arguments[0]));
}
function findProperty(objectExpression, key, fallback) {
    let value = null;
    for (const p of objectExpression.properties) {
        if (!core_1.types.isObjectProperty(p) && !core_1.types.isObjectMethod(p)) {
            continue;
        }
        if ((core_1.types.isIdentifier(p.key) && p.key.name === key) ||
            (core_1.types.isStringLiteral(p.key) && p.key.value === key)) {
            if (core_1.types.isObjectProperty(p)) {
                value = p.value;
                break;
            }
            else if (core_1.types.isObjectMethod(p)) {
                value = core_1.types.toExpression(p);
                break;
            }
        }
    }
    return value ?? fallback();
}
function hasStaticProperties(objectExpression) {
    return objectExpression.properties.every((p) => {
        if (('computed' in p && p.computed) || core_1.types.isSpreadElement(p)) {
            return false;
        }
        if (core_1.types.isObjectMethod(p) && p.kind !== 'method') {
            return false;
        }
        return core_1.types.isIdentifier(p.key) || core_1.types.isStringLiteral(p.key);
    });
}
