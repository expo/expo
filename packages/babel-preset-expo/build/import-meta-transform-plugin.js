"use strict";
// Copyright 2015-present 650 Industries. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoImportMetaTransformPluginFactory = expoImportMetaTransformPluginFactory;
function expoImportMetaTransformPluginFactory(pluginEnabled) {
    return (api) => {
        const { types: t } = api;
        return {
            name: 'expo-import-meta-transform',
            visitor: {
                MetaProperty(path) {
                    const { node } = path;
                    if (node.meta.name === 'import' && node.property.name === 'meta') {
                        if (!pluginEnabled) {
                            throw path.buildCodeFrameError('Your code uses `import.meta` which is not supported in the React Native runtime yet. Enable the `unstable_transformImportMeta` option in babel-preset-expo to use `import.meta`.');
                        }
                        const replacement = t.memberExpression(t.identifier('globalThis'), t.identifier('__ExpoImportMetaRegistry'));
                        path.replaceWith(replacement);
                    }
                },
            },
        };
    };
}
