"use strict";
// Copyright 2015-present 650 Industries. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoImportMetaTransformPlugin = expoImportMetaTransformPlugin;
function expoImportMetaTransformPlugin(api) {
    const { types: t } = api;
    return {
        name: 'expo-import-meta-transform',
        visitor: {
            MetaProperty(path) {
                const { node } = path;
                if (node.meta.name === 'import' && node.property.name === 'meta') {
                    const replacement = t.memberExpression(t.identifier('globalThis'), t.identifier('__ExpoImportMetaRegistry'));
                    path.replaceWith(replacement);
                }
            },
        },
    };
}
