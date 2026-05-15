"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset`.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/plugin-warn-on-deep-imports.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const INITIALIZE_CORE = 'react-native/Libraries/Core/InitializeCore';
function withLocation(node, loc) {
    if (!node.loc) {
        return { ...node, loc };
    }
    return node;
}
function isDeepReactNativeImport(source) {
    return source.startsWith('react-native/');
}
exports.default = ({ types: t, }) => ({
    name: 'warn-on-deep-imports',
    visitor: {
        ImportDeclaration(path, state) {
            const source = path.node.source.value;
            if (isDeepReactNativeImport(source) && source !== INITIALIZE_CORE) {
                state.deepImports.push({ source, loc: path.node.loc });
            }
        },
        CallExpression(path, state) {
            const { callee } = path.node;
            if (!('name' in callee) || callee.name !== 'require')
                return;
            const args = path.node.arguments;
            if (args.length !== 1 || !t.isStringLiteral(args[0]))
                return;
            const source = args[0].value;
            if (isDeepReactNativeImport(source) && source !== INITIALIZE_CORE) {
                state.deepImports.push({ source, loc: path.node.loc });
            }
        },
        ExportNamedDeclaration(path, state) {
            const source = path.node.source;
            if (source && isDeepReactNativeImport(source.value) && source.value !== INITIALIZE_CORE) {
                state.deepImports.push({ source: source.value, loc: path.node.loc });
            }
        },
        Program: {
            enter(_path, state) {
                state.deepImports = [];
            },
            exit(path, state) {
                for (const { source, loc } of state.deepImports) {
                    let message = `Deep imports from the 'react-native' package are deprecated ('${source}').`;
                    if (state.filename) {
                        message += ` Source: ${state.filename} ${loc ? `${loc.start.line}:${loc.start.column}` : ''}`;
                    }
                    const warning = withLocation(t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('console'), t.identifier('warn')), [
                        t.stringLiteral(message),
                    ])), loc);
                    path.node.body.push(warning);
                }
            },
        },
    },
});
//# sourceMappingURL=warn-on-deep-rn-imports.js.map