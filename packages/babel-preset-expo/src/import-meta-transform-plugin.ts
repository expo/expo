// Copyright 2015-present 650 Industries. All rights reserved.

import { ConfigAPI, types } from '@babel/core';

export function expoImportMetaTransformPlugin(
  api: ConfigAPI & { types: typeof types }
): babel.PluginObj {
  const { types: t } = api;

  return {
    name: 'expo-import-meta-transform',
    visitor: {
      MetaProperty(path) {
        const { node } = path;
        if (node.meta.name === 'import' && node.property.name === 'meta') {
          const replacement = t.memberExpression(
            t.identifier('globalThis'),
            t.identifier('__ExpoImportMetaRegistry')
          );
          path.replaceWith(replacement);
        }
      },
    },
  };
}
