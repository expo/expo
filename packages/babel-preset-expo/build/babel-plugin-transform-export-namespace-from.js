"use strict";
/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) 2014-present Sebastian McKenzie and other contributors
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Original: https://github.com/babel/babel/blob/e5c8dc7330cb2f66c37637677609df90b31ff0de/packages/babel-plugin-transform-export-namespace-from/src/index.ts
// NOTE: Original plugin asserts that Babel version 7 or newer is used. This was removed for simplicity.
exports.default = ({ types: t }) => ({
    name: 'transform-export-namespace-from',
    manipulateOptions: process.env.BABEL_8_BREAKING
        ? undefined
        : (_, parser) => parser.plugins.push('exportNamespaceFrom'),
    visitor: {
        ExportNamedDeclaration(path) {
            const { node, scope } = path;
            const { specifiers } = node;
            const index = t.isExportDefaultSpecifier(specifiers[0]) ? 1 : 0;
            if (!t.isExportNamespaceSpecifier(specifiers[index]))
                return;
            const nodes = [];
            if (index === 1) {
                nodes.push(t.exportNamedDeclaration(null, [specifiers.shift()], node.source));
            }
            const specifier = specifiers.shift();
            const { exported } = specifier;
            const uid = scope.generateUidIdentifier(
            // @ts-expect-error Identifier ?? StringLiteral
            exported.name ?? exported.value);
            nodes.push(withLocation(t.importDeclaration([t.importNamespaceSpecifier(uid)], 
            // @ts-expect-error
            t.cloneNode(node.source)), node.loc), withLocation(t.exportNamedDeclaration(null, [t.exportSpecifier(t.cloneNode(uid), exported)]), node.loc));
            if (node.specifiers.length >= 1) {
                nodes.push(node);
            }
            const [importDeclaration] = path.replaceWithMultiple(nodes);
            path.scope.registerDeclaration(importDeclaration);
        },
    },
});
// Inspired by https://github.com/facebook/metro/blob/8e48aa823378962beccbe37d85f1aff2c34b28b1/packages/metro-transform-plugins/src/import-export-plugin.js#L143
function withLocation(node, loc) {
    if (!node.loc) {
        return { ...node, loc };
    }
    return node;
}
