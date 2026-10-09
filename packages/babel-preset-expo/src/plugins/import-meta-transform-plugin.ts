// Copyright 2015-present 650 Industries. All rights reserved.

import type { ConfigAPI, PluginObj } from '@babel/core';
import { pathToFileURL } from 'node:url';

import { getBundler, getPlatform } from '../common';

export function expoImportMetaTransformPluginFactory(pluginEnabled: boolean) {
  return (api: ConfigAPI & typeof import('@babel/core')): PluginObj => {
    const { types: t } = api;
    const platform = api.caller(getPlatform);
    const bundler = api.caller(getBundler);

    return {
      name: 'expo-import-meta-transform',
      visitor: {
        MetaProperty(path, state) {
          const { node } = path;
          if (node.meta.name === 'import' && node.property.name === 'meta') {
            if (bundler === 'jest') {
              // NOTE(@kitten): Jest runs each file in Node, so `import.meta.url` can be the module's own file URL.
              const { filename } = state.file.opts;
              path.replaceWith(
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('url'),
                    filename ? t.stringLiteral(pathToFileURL(filename).href) : t.nullLiteral()
                  ),
                ])
              );
            } else if (!pluginEnabled) {
              if (platform !== 'web') {
                throw path.buildCodeFrameError(
                  '`import.meta` is not supported in Hermes. Enable the polyfill `transformImportMeta` in babel-preset-expo to use this syntax.'
                );
              }
            } else {
              const replacement = t.memberExpression(
                t.identifier('globalThis'),
                t.identifier('__ExpoImportMetaRegistry')
              );
              path.replaceWith(replacement);
            }
          }
        },
      },
    };
  };
}
