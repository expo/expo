"use strict";
// Copyright 2015-present 650 Industries. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.expoImportMetaTransformPluginFactory = expoImportMetaTransformPluginFactory;
const node_url_1 = require("node:url");
const common_1 = require("../common");
function expoImportMetaTransformPluginFactory(pluginEnabled) {
    return (api) => {
        const { types: t } = api;
        const platform = api.caller(common_1.getPlatform);
        const bundler = api.caller(common_1.getBundler);
        return {
            name: 'expo-import-meta-transform',
            visitor: {
                MetaProperty(path, state) {
                    const { node } = path;
                    if (node.meta.name === 'import' && node.property.name === 'meta') {
                        if (bundler === 'jest') {
                            // NOTE(@kitten): Jest runs each file in Node, so `import.meta.url` can be the module's own file URL.
                            const { filename } = state.file.opts;
                            path.replaceWith(t.objectExpression([
                                t.objectProperty(t.identifier('url'), filename ? t.stringLiteral((0, node_url_1.pathToFileURL)(filename).href) : t.nullLiteral()),
                            ]));
                        }
                        else if (!pluginEnabled) {
                            if (platform !== 'web') {
                                throw path.buildCodeFrameError('`import.meta` is not supported in Hermes. Enable the polyfill `transformImportMeta` in babel-preset-expo to use this syntax.');
                            }
                        }
                        else {
                            const replacement = t.memberExpression(t.identifier('globalThis'), t.identifier('__ExpoImportMetaRegistry'));
                            path.replaceWith(replacement);
                        }
                    }
                },
            },
        };
    };
}
//# sourceMappingURL=import-meta-transform-plugin.js.map