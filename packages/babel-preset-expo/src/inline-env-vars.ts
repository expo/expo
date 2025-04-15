import { ConfigAPI, NodePath, PluginObj, types as t } from '@babel/core';
import { createAddNamedImportOnce, getIsProd } from './common';

const debug = require('debug')('expo:babel:env-vars');

export function expoInlineEnvVars(api: ConfigAPI & { types: typeof t }): PluginObj {
  const isProduction = api.caller(getIsProd);

  function isFirstInAssign(path: NodePath<t.MemberExpression>) {
    return t.isAssignmentExpression(path.parent) && path.parent.left === path.node;
  }

  let addEnvImport: () => t.Identifier;

  return {
    name: 'expo-inline-or-reference-env-vars',
    pre(file) {
      file.metadata.publicEnvVars = new Set<string>();

      const addNamedImportOnce = createAddNamedImportOnce(t);

      addEnvImport = () => {
        return addNamedImportOnce(file.path, 'env', 'expo/virtual/env');
      };
    },
    visitor: {
      MemberExpression(path, state) {
        const filename = state.filename;
        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey();
          if (
            t.isStringLiteral(key) &&
            !isFirstInAssign(path) &&
            key.value.startsWith('EXPO_PUBLIC_')
          ) {
            const envVar = key.value;
            debug(
              `${isProduction ? 'Inlining' : 'Referencing'} environment variable in %s: %s`,
              filename,
              envVar
            );

            state.file.metadata.publicEnvVars.add(envVar);
            if (isProduction) {
              path.replaceWith(t.valueToNode(process.env[envVar]));
            } else {
              path.replaceWith(t.memberExpression(addEnvImport(), t.identifier(envVar)));
            }
          }
        }
      },
    },
    post(file) {
      file.metadata.publicEnvVars = Array.from(file.metadata.publicEnvVars);
    },
  };
}
