// Copyright 2015-present 650 Industries. All rights reserved.

import type { ConfigAPI, PluginObj } from '@babel/core';

import { getPlatform } from './common';

export function expoImportMetaTransformPluginFactory(pluginEnabled: boolean) {
  return (api: ConfigAPI & typeof import('@babel/core')): PluginObj => {
    const { types: t } = api;
    const platform = api.caller(getPlatform);

    return {
      name: 'expo-import-meta-transform',
      visitor: {
        MetaProperty(path) {
          const { node } = path;
          if (node.meta.name === 'import' && node.property.name === 'meta') {
            if (!pluginEnabled) {
              if (platform !== 'web') {
                throw path.buildCodeFrameError(
                  '`import.meta` is not supported in Hermes. Enable the polyfill `unstable_transformImportMeta` in babel-preset-expo to use this syntax.'
                );
              }
              return;
            }
            const replacement = t.memberExpression(
              t.identifier('globalThis'),
              t.identifier('__ExpoImportMetaRegistry')
            );
            path.replaceWith(replacement);
          }
        },
      },
    };
  };
}
